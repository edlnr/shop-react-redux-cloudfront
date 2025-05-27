import { SQSEvent, SQSHandler } from "aws-lambda";
import { productService } from "../../services/productService";

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log("Event:", JSON.stringify(event));

  if (!event.Records || event.Records.length === 0) {
    console.log("No records to process");
    return;
  }

  console.log(`Processing ${event.Records.length} messages`);

  for (const record of event.Records) {
    try {
      await productService.processProductFromSQS(record.body);
    } catch (error) {
      console.error("Error processing message:", record.body, "Error:", error);
    }
  }

  console.log("Completed processing all messages");
};
