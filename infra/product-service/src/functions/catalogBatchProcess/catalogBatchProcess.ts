import { SQSEvent, SQSHandler } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { productService } from "../../services/productService";

export const handler: SQSHandler = async (event: SQSEvent) => {
  const batchId = uuidv4();
  console.log(`[Batch ${batchId}] Event:`, JSON.stringify(event));

  if (!event.Records || event.Records.length === 0) {
    console.log(`[Batch ${batchId}] No records to process`);
    return;
  }

  console.log(`[Batch ${batchId}] Processing ${event.Records.length} messages`);

  const results = {
    total: event.Records.length,
    successful: 0,
    failed: 0,
  };

  for (const record of event.Records) {
    try {
      await productService.processProductFromSQS(record.body);
      results.successful++;
    } catch (error) {
      console.error(
        `[Batch ${batchId}] Error processing message:`,
        record.body,
        "Error:",
        error
      );
      results.failed++;
    }
  }

  console.log(
    `[Batch ${batchId}] Completed processing all messages. Results: `,
    results
  );
};
