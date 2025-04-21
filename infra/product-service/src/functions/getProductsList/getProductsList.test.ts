import { handler } from "./getProductsList";
import { APIGatewayResponse } from "../../libs/api-gateway";
import { mockProducts } from "../../mocks/products";
import { productService } from "../../services/productService";

jest.mock("../../services/productService");

describe("getProductsList", () => {
  it("should return all products", async () => {
    (productService.getAllProducts as jest.Mock).mockResolvedValue(
      mockProducts
    );

    const result = await handler({} as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual(
      mockProducts
    );
  });

  it("should handle errors", async () => {
    (productService.getAllProducts as jest.Mock).mockRejectedValue(
      new Error("Test error")
    );

    const result = await handler({} as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual({
      message: "Internal server error",
    });
  });
});
