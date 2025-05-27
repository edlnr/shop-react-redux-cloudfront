import { SQSEvent, SQSHandler } from "aws-lambda";
import { productService } from "../../services/productService";
import { validateProductDto } from "../../models/product";

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Event:", JSON.stringify(event));

  if (!event.Records || event.Records.length === 0) {
    console.log("No records to process");
    return;
  }

  console.log(`Processing ${event.Records.length} messages`);

  for (const record of event.Records) {
    try {
      const productData = JSON.parse(record.body);

      const validation = validateProductDto(productData);
      if (!validation.isValid) {
        console.error(
          "Invalid product data:",
          productData,
          "Errors:",
          validation.errors
        );
        continue;
      }

      await productService.processProductFromSQS(record.body);
    } catch (error) {
      console.error("Error processing message:", record.body, "Error:", error);
    }
  }

  console.log("Completed processing all messages");
};
