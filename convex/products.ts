import { query } from "./_generated/server";
import { v } from "convex/values";

// Hard-coded products list (no database table needed)
const PRODUCTS = [
  {
    id: "PROD-001",
    name: "Fresh Apples",
    category: "Fruits",
  },
  {
    id: "PROD-002",
    name: "Bananas",
    category: "Fruits",
  },
  {
    id: "PROD-003",
    name: "Milk",
    category: "Dairy",
  },
  {
    id: "PROD-004",
    name: "Bread",
    category: "Bakery",
  },
  {
    id: "PROD-005",
    name: "Eggs",
    category: "Dairy",
  },
  {
    id: "PROD-006",
    name: "Tomatoes",
    category: "Vegetables",
  },
  {
    id: "PROD-007",
    name: "Carrots",
    category: "Vegetables",
  },
  {
    id: "PROD-008",
    name: "Cheese",
    category: "Dairy",
  },
  {
    id: "PROD-009",
    name: "Chicken",
    category: "Meat",
  },
  {
    id: "PROD-010",
    name: "Rice",
    category: "Grains",
  },
];

// Get all products
export const list = query({
  handler: async () => {
    return PRODUCTS;
  },
});

// Get product by ID
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return PRODUCTS.find((p) => p.id === args.id) || null;
  },
});
