import { APIGatewayProxyHandler } from "aws-lambda";
import { formatResponse } from "../../libs/api-gateway";
import { productService } from "../../services/productService";
import { validateProductDto } from "../../models/product";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  try {
    const requestBody = JSON.parse(event.body || "{}");

    const validation = validateProductDto(requestBody);
    if (!validation.isValid) {
      return formatResponse(400, {
        message: "Invalid product data",
        errors: validation.errors,
      });
    }

    const product = await productService.createProduct(requestBody);

    return formatResponse(201, product);
  } catch (error) {
    console.error("Error creating product:", error);
    return formatResponse(500, { message: "Internal server error" });
  }
};
