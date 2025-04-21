import { APIGatewayProxyHandler } from "aws-lambda";
import { formatResponse } from "../../libs/api-gateway";
import { productService } from "../../services/productService";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const products = await productService.getAllProducts();
    return formatResponse(200, products);
  } catch (error) {
    return formatResponse(500, { message: "Internal server error" });
  }
};
