export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export function validateProductDto(data: Product): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== "string") {
    errors.push("Title is required and must be a string");
  }

  if (data.description !== undefined && typeof data.description !== "string") {
    errors.push("Description must be a string");
  }

  if (!data.price || typeof data.price !== "number" || data.price <= 0) {
    errors.push("Price is required and must be a positive number");
  }

  if (
    !data.count ||
    typeof data.count !== "number" ||
    data.count < 0 ||
    !Number.isInteger(data.count)
  ) {
    errors.push("Count is required and must be a non-negative integer");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
