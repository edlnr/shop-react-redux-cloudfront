import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { formatResponse } from "../../utils/api-gateway";
import { productService } from "../../services/productService";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", JSON.stringify(event));

  try {
    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
      return formatResponse(400, {
        message: 'Missing "name" query string parameter (fileName).',
      });
    }

    if (!fileName.endsWith(".csv")) {
      return formatResponse(400, { message: "File name must end with .csv" });
    }

    const signedUrl = await productService.importProductsFile(fileName);

    return formatResponse(200, {
      signedUrl,
    });
  } catch (error) {
    console.error("Error importing products:", error);
    return formatResponse(500, { message: "Internal server error" });
  }
};
