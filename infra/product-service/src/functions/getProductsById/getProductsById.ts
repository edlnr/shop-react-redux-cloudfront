import { APIGatewayProxyHandler } from "aws-lambda";
import { formatResponse } from "../../libs/api-gateway";
import { productService } from "../../services/productService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { productId } = event.pathParameters || {};

    if (!productId) {
      return formatResponse(400, { message: "Product ID is required" });
    }

    const product = await productService.getProductById(productId);

    if (!product) {
      return formatResponse(404, { message: "Product not found" });
    }

    return formatResponse(200, product);
  } catch (error) {
    return formatResponse(500, { message: "Internal server error" });
  }
};
