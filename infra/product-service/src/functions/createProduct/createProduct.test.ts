import { handler } from "./createProduct";
import { APIGatewayResponse } from "../../utils/api-gateway";
import { productService } from "../../services/productService";
import * as productDtoModule from "../../models/product";

jest.mock("../../services/productService");
jest.mock("../../models/product");

describe("createProduct", () => {
  const validProductDto = {
    title: "New Product",
    description: "This is a new product",
    price: 99.99,
    count: 10,
  };

  const createdProduct = {
    id: "new-uuid",
    ...validProductDto,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a product successfully", async () => {
    (productDtoModule.validateProductDto as jest.Mock).mockReturnValue({
      isValid: true,
      errors: [],
    });

    (productService.createProduct as jest.Mock).mockResolvedValue(
      createdProduct
    );

    const event = {
      body: JSON.stringify(validProductDto),
    };

    const result = await handler(event as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual(
      createdProduct
    );
    expect(productService.createProduct).toHaveBeenCalledWith(validProductDto);
  });

  it("should return 400 for invalid product data", async () => {
    const validationErrors = ["Title is required", "Price must be positive"];
    (productDtoModule.validateProductDto as jest.Mock).mockReturnValue({
      isValid: false,
      errors: validationErrors,
    });

    const invalidProductDto = {
      description: "Missing required fields",
    };

    const event = {
      body: JSON.stringify(invalidProductDto),
    };

    const result = await handler(event as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual({
      message: "Invalid product data",
      errors: validationErrors,
    });
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it("should handle empty request body", async () => {
    (productDtoModule.validateProductDto as jest.Mock).mockReturnValue({
      isValid: false,
      errors: ["Required fields missing"],
    });

    const event = {
      body: null,
    };

    const result = await handler(event as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(400);
    expect(productService.createProduct).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    (productDtoModule.validateProductDto as jest.Mock).mockReturnValue({
      isValid: true,
      errors: [],
    });

    (productService.createProduct as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const event = {
      body: JSON.stringify(validProductDto),
    };

    const result = await handler(event as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual({
      message: "Internal server error",
    });
    expect(productService.createProduct).toHaveBeenCalledWith(validProductDto);
  });

  it("should handle JSON parsing errors", async () => {
    const event = {
      body: "{ invalid json }",
    };

    const result = await handler(event as any, {} as any, {} as any);

    expect((result as APIGatewayResponse).statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayResponse).body)).toEqual({
      message: "Internal server error",
    });
    expect(productService.createProduct).not.toHaveBeenCalled();
  });
});
