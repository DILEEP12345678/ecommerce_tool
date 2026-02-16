import { query } from "./_generated/server";
import { v } from "convex/values";

// Hard-coded products list (no database table needed)
const PRODUCTS = [
  {
    id: "PROD-001",
    name: "Fresh Apples",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-002",
    name: "Bananas",
    category: "Fruits",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-003",
    name: "Milk",
    category: "Dairy",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-004",
    name: "Bread",
    category: "Bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-005",
    name: "Eggs",
    category: "Dairy",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-006",
    name: "Tomatoes",
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-007",
    name: "Carrots",
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-008",
    name: "Cheese",
    category: "Dairy",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-009",
    name: "Chicken",
    category: "Meat",
    image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop",
  },
  {
    id: "PROD-010",
    name: "Rice",
    category: "Grains",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
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
