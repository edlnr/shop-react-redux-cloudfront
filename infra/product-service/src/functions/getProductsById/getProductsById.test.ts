import { handler } from "./getProductsById";
import { APIGatewayResponse } from "../../libs/api-gateway";
import { mockProducts } from "../../mocks/products";
import { productService } from "../../services/productService";

jest.mock("../../services/productService");

describe("getProductsById", () => {
  it("should return product by id", async () => {
    (productService.getProductById as jest.Mock).mockResolvedValue(
      mockProducts[0]
    );

    const result = await handler(
      { pathParameters: { productId: "1" } } as any,
      {} as any,
      {} as any
    );

    expect((result as APIGatewayResponse).statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual(
      mockProducts[0]
    );
  });

  it("should handle errors", async () => {
    (productService.getProductById as jest.Mock).mockRejectedValue(
      new Error("Test error")
    );

    const result = await handler(
      { pathParameters: { productId: "0" } } as any,
      {} as any,
      {} as any
    );

    expect((result as APIGatewayResponse).statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual({
      message: "Internal server error",
    });
  });
});
