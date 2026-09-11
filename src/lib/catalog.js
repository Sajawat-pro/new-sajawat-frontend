// lib/catalog.js
import { products } from "@/data/products"; // Import your static array

// Overwrite getProducts to return the static array
export const getProducts = async () => {
  return products; 
};

export const getProductBySlug = async (slug) => {
  return products.find((product) => product.slug === slug) || null;
};