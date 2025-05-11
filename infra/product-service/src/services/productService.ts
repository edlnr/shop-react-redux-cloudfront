import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Product } from "../models/product";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

export class ProductService {
  private productsTableName: string;
  private stockTableName: string;

  constructor() {
    this.productsTableName = "products";
    this.stockTableName = "stock";
  }

  async getAllProducts(): Promise<Product[]> {
    const productsResponse = await docClient.send(
      new ScanCommand({
        TableName: this.productsTableName,
      })
    );
    const products = productsResponse.Items || [];

    const stockResponse = await docClient.send(
      new ScanCommand({
        TableName: this.stockTableName,
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
        TableName: this.productsTableName,
        Key: { id },
      })
    );

    const product = productResponse.Item;

    if (!product) {
      return null;
    }

    const stockResponse = await docClient.send(
      new GetCommand({
        TableName: this.stockTableName,
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
        TableName: this.productsTableName,
        Item: productItem,
      })
    );

    await docClient.send(
      new PutCommand({
        TableName: this.stockTableName,
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
}

export const productService = new ProductService();
