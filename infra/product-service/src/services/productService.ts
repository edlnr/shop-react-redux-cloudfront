import csv from "csv-parser";
import { S3Event } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";
import { Product } from "../models/product";

const REGION = "us-east-1";

const client = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME ?? "products";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME ?? "stock";
const IMPORT_SERVICE_BUCKET_NAME = process.env.IMPORT_SERVICE_BUCKET_NAME;
const UPLOADED_PREFIX = process.env.UPLOADED_PREFIX ?? "uploaded/";
const PARSED_PREFIX = process.env.PARSED_PREFIX ?? "parsed/";
const CATALOG_ITEMS_QUEUE_URL = process.env.CATALOG_ITEMS_QUEUE_URL;
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;

export class ProductService {
  async getAllProducts(): Promise<Product[]> {
    const productsResponse = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
      })
    );
    const products = productsResponse.Items || [];

    const stockResponse = await docClient.send(
      new ScanCommand({
        TableName: STOCK_TABLE_NAME,
      })
    );
    const stockItems = stockResponse.Items || [];

    const stockMap = stockItems.reduce((acc, item) => {
      acc[item.product_id] = item.count;
      return acc;
    }, {});

    const joinedProducts = products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stockMap[product.id] || 0,
    }));

    return joinedProducts;
  }

  async getProductById(id: string): Promise<Product | null> {
    const productResponse = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: { id },
      })
    );

    const product = productResponse.Item;

    if (!product) {
      return null;
    }

    const stockResponse = await docClient.send(
      new GetCommand({
        TableName: STOCK_TABLE_NAME,
        Key: { product_id: id },
      })
    );

    const stock = stockResponse.Item;

    const joinedProduct: Product = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stock?.count || 0,
    };

    return joinedProduct;
  }

  async createProduct(productDto: Product): Promise<Product> {
    const productId = uuidv4();

    const productItem = {
      id: uuidv4(),
      title: productDto.title,
      description: productDto.description || "",
      price: productDto.price,
    };

    const stockItem = {
      product_id: productId,
      count: productDto.count,
    };

    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Item: productItem,
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: STOCK_TABLE_NAME,
        Item: stockItem,
      })
    );

    return {
      id: productId,
      title: productDto.title,
      description: productDto.description || "",
      price: productDto.price,
      count: productDto.count,
    };
  }

  async importProductsFile(fileName: string): Promise<string> {
    const s3Key = `${UPLOADED_PREFIX}${fileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: IMPORT_SERVICE_BUCKET_NAME,
      Key: s3Key,
      ContentType: "text/csv",
    });

    const signedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 300,
    });

    return signedUrl;
  }

  async importFileParser(event: S3Event): Promise<void> {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " ")
      );

      console.log(`Processing file: s3://${bucketName}/${objectKey}`);

      if (!objectKey.startsWith(UPLOADED_PREFIX)) {
        console.log(
          `Skipping file ${objectKey} as it's not in the ${UPLOADED_PREFIX} prefix.`
        );
        continue;
      }
      if (!objectKey.toLowerCase().endsWith(".csv")) {
        console.log(`Skipping file ${objectKey} as it's not a CSV file.`);
        continue;
      }

      const getObjectParams = {
        Bucket: bucketName,
        Key: objectKey,
      };

      try {
        const getObjectCommand = new GetObjectCommand(getObjectParams);
        const s3Object = await s3Client.send(getObjectCommand);

        if (!s3Object.Body) {
          console.error(`No body in S3 object: ${objectKey}`);
          continue;
        }

        const stream = s3Object.Body as Readable;

        await new Promise<void>((resolve, reject) => {
          stream
            .pipe(csv())
            .on("data", async (data) => {
              try {
                if (!CATALOG_ITEMS_QUEUE_URL) {
                  console.error("CATALOG_ITEMS_QUEUE_URL is not defined");
                  return;
                }

                console.log("Sending product data to SQS:", data);

                const sendMessageCommand = new SendMessageCommand({
                  QueueUrl: CATALOG_ITEMS_QUEUE_URL,
                  MessageBody: JSON.stringify(data),
                });

                await sqsClient.send(sendMessageCommand);
                console.log("Successfully sent message to SQS");
              } catch (error) {
                console.error("Error sending message to SQS:", error);
              }
            })
            .on("end", async () => {
              console.log(`CSV parsing finished for ${objectKey}`);

              const parsedKey = objectKey.replace(
                UPLOADED_PREFIX,
                PARSED_PREFIX
              );

              console.log(`Moving ${objectKey} to ${parsedKey}`);

              const copyCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${objectKey}`,
                Key: parsedKey,
              });

              await s3Client.send(copyCommand);

              console.log(`Copied to ${parsedKey}`);

              const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
              });

              await s3Client.send(deleteCommand);

              console.log(`Deleted original ${objectKey}`);

              resolve();
            })
            .on("error", (error) => {
              console.error(`Error parsing CSV for ${objectKey}:`, error);
              reject(error);
            });
        });
      } catch (error) {
        console.error(`Error processing file ${objectKey}:`, error);
      }
    }
  }

  async processProductFromSQS(messageBody: string): Promise<Product | null> {
    try {
      const productData = JSON.parse(messageBody);
      console.log("Processing product:", productData);

      const createdProduct = await this.createProduct(productData);
      console.log("Product created successfully:", createdProduct);

      if (CREATE_PRODUCT_TOPIC_ARN) {
        try {
          const message = {
            productId: createdProduct.id,
            title: createdProduct.title,
            description: createdProduct.description,
            price: createdProduct.price,
            count: createdProduct.count,
          };

          const command = new PublishCommand({
            TopicArn: CREATE_PRODUCT_TOPIC_ARN,
            Subject: `New product created: ${createdProduct.title}`,
            Message: JSON.stringify(message),
            MessageAttributes: {
              productId: {
                DataType: "String",
                StringValue: createdProduct.id,
              },
              price: {
                DataType: "Number",
                StringValue: createdProduct.price.toString(),
              },
            },
          });

          await snsClient.send(command);
          console.log(
            `Notification sent to SNS topic: ${CREATE_PRODUCT_TOPIC_ARN}`
          );
        } catch (snsError) {
          console.error("Error sending SNS notification:", snsError);
        }
      }

      return createdProduct;
    } catch (error) {
      console.error("Error processing product:", error);
      return null;
    }
  }
}

export const productService = new ProductService();
