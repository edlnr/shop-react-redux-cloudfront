import { APIGatewayProxyHandler } from "aws-lambda";
import { formatResponse } from "../../utils/api-gateway";
import { productService } from "../../services/productService";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  try {
    const products = await productService.getAllProducts();
    return formatResponse(200, products);
  } catch (error) {
    console.error("Error getting all products:", error);
    return formatResponse(500, { message: "Internal server error" });
  }
};
