import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { toDynamoDBItem } from "./toDynamoDBItem";

const client = new DynamoDBClient({
  region: "us-east-1",
});

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface StockItem {
  product_id: string;
  count: number;
}

const products: Product[] = [
  {
    id: uuidv4(),
    title: "Laptop",
    description: "High-performance laptop with 16GB RAM",
    price: 1200,
  },
  {
    id: uuidv4(),
    title: "Smartphone",
    description: "Latest model with advanced camera",
    price: 800,
  },
  {
    id: uuidv4(),
    title: "Headphones",
    description: "Noise-cancelling wireless headphones",
    price: 250,
  },
  {
    id: uuidv4(),
    title: "Tablet",
    description: "10-inch screen with stylus support",
    price: 500,
  },
  {
    id: uuidv4(),
    title: "Smartwatch",
    description: "Fitness tracking and notifications",
    price: 300,
  },
];

async function addProducts(): Promise<Product[]> {
  console.log("Adding products to DynamoDB...");

  for (const product of products) {
    const params = {
      TableName: "products",
      Item: toDynamoDBItem(product),
    };

    try {
      await client.send(new PutItemCommand(params));
      console.log(`Added product: ${product.title} with ID: ${product.id}`);
    } catch (error) {
      console.error(`Failed to add product ${product.title}:`, error);
    }
  }

  return products;
}

async function addStock(products: Product[]): Promise<void> {
  console.log("\nAdding stock information...");

  for (const product of products) {
    const stockCount = Math.floor(Math.random() * 100) + 1;

    const stockItem: StockItem = {
      product_id: product.id,
      count: stockCount,
    };

    const params = {
      TableName: "stock",
      Item: toDynamoDBItem(stockItem),
    };

    try {
      await client.send(new PutItemCommand(params));
      console.log(`Added stock for ${product.title}: ${stockCount} units`);
    } catch (error) {
      console.error(`Failed to add stock for product ${product.id}:`, error);
    }
  }
}

async function populateTables(): Promise<void> {
  try {
    const addedProducts = await addProducts();
    await addStock(addedProducts);
    console.log("\nDatabase population completed successfully!");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

populateTables();
