import { mockProducts } from "../mocks/products";
import { Product } from "../models/product";

export class ProductService {
  private products: Product[] = mockProducts;

  async getAllProducts(): Promise<Product[]> {
    return this.products;
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) || null;
  }
}

export const productService = new ProductService();
