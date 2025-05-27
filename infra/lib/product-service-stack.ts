import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as path from "path";
import * as nodeJsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { CLOUDFRONT_URL } from "../constants/constants";

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;
  public readonly createProductTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      tableName: "stock",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.catalogItemsQueue = new sqs.Queue(this, "catalog-items-queue");

    this.createProductTopic = new sns.Topic(this, "create-product-topic", {
      displayName: "Product Creation Notifications",
    });

    this.createProductTopic.addSubscription(
      new snsSubs.EmailSubscription("notmyrealemailREPLACEIT@gmail.com")
    );

    const getProductsList = new nodeJsLambda.NodejsFunction(
      this,
      "getProductsList",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "../product-service/src/functions/getProductsList/getProductsList.ts"
        ),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
        },
      }
    );

    const getProductsById = new nodeJsLambda.NodejsFunction(
      this,
      "getProductsById",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "../product-service/src/functions/getProductsById/getProductsById.ts"
        ),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
        },
      }
    );

    const catalogBatchProcess = new nodeJsLambda.NodejsFunction(
      this,
      "catalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "../product-service/src/functions/catalogBatchProcess/catalogBatchProcess.ts"
        ),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
          CREATE_PRODUCT_TOPIC_ARN: this.createProductTopic.topicArn,
        },
      }
    );

    catalogBatchProcess.addEventSourceMapping("catalog-batch-process-mapping", {
      eventSourceArn: this.catalogItemsQueue.queueArn,
      batchSize: 5,
    });

    const createProduct = new nodeJsLambda.NodejsFunction(
      this,
      "createProduct",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "../product-service/src/functions/createProduct/createProduct.ts"
        ),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
        },
      }
    );

    productsTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stockTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stockTable.grantWriteData(createProduct);
    productsTable.grantWriteData(catalogBatchProcess);
    stockTable.grantWriteData(catalogBatchProcess);

    this.catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);
    this.createProductTopic.grantPublish(catalogBatchProcess);

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Product Service",
      defaultCorsPreflightOptions: {
        allowOrigins: [CLOUDFRONT_URL],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const products = api.root.addResource("products");
    products.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );

    products.addMethod("POST", new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource("{productId}");
    product.addMethod("GET", new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, "ProductsApiEndpoint", {
      value: `${api.url}products`,
      description:
        "API Gateway endpoint URL for Prod stage for Products service",
      exportName: "ProductsApiEndpoint",
    });
  }
}
