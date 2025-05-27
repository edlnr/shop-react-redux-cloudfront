import { Product, validateProductDto } from "../models/product";

/**
 * Prepares and validates product data from SQS message
 * @param messageBody The raw SQS message body
 * @returns An object with the processed data and validation result
 */
export const processProductData = (
  messageBody: string
): {
  productData: Product | null;
  validation: {
    isValid: boolean;
    errors: string[];
  };
} => {
  try {
    const productData = JSON.parse(messageBody);

    if (productData.price && typeof productData.price === "string") {
      productData.price = parseFloat(productData.price);
    }

    if (productData.count && typeof productData.count === "string") {
      productData.count = parseInt(productData.count, 10);
    }

    const validation = validateProductDto(productData);

    return {
      productData,
      validation,
    };
  } catch (error) {
    console.error("Error processing product data:", error);
    return {
      productData: null,
      validation: { isValid: false, errors: ["Failed to parse message body"] },
    };
  }
};
