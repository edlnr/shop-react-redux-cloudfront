import { S3Event, S3Handler } from "aws-lambda";
import { productService } from "../../services/productService";

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  console.log("Received S3 event:", JSON.stringify(event));

  try {
    await productService.importFileParser(event);
  } catch (error) {
    console.error("Error parsing the imported products:", error);
  }
};
