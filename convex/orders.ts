import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create order with items array (single row per order)
export const create = mutation({
  args: {
    items: v.array(
      v.object({
        itemId: v.string(),
        itemName: v.string(),
        quantity: v.number(),
      })
    ),
    username: v.string(),
    collectionPoint: v.string(),
  },
  handler: async (ctx, args) => {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    // Pre-compute values for better query performance
    const itemCount = args.items.length;
    const totalQuantity = args.items.reduce((sum, item) => sum + item.quantity, 0);

    // Insert single order with items array
    await ctx.db.insert("orders", {
      orderId,
      username: args.username,
      collectionPoint: args.collectionPoint,
      items: args.items,
      status: "pending",
      createdAt,
      statusUpdatedAt: createdAt,
      itemCount,
      totalQuantity,
    });

    return orderId;
  },
});

// Get orders by username (for customers)
export const getByUsername = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50; // Default limit of 50 orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .order("desc")
      .take(limit);

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    }));
  },
});

// Get orders by collection point (for collection point managers)
export const getByCollectionPoint = query({
  args: {
    collectionPoint: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100; // Default limit of 100 orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_collection_point", (q) => q.eq("collectionPoint", args.collectionPoint))
      .order("desc")
      .take(limit);

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    }));
  },
});

// Get single order by orderId
export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      return null;
    }

    return {
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    };
  },
});

// Get all orders
export const listAll = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .collect();

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    }));
  },
});

// Update order status (single update per order - much faster!)
export const updateStatus = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("collected"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    // Find the order
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .first();

    if (!order) {
      throw new Error("Order not found");
    }

    // Single update - much faster than updating multiple rows!
    await ctx.db.patch(order._id, {
      status: args.status,
      statusUpdatedAt: Date.now(), // Track when status changed
    });
  },
});

// Get order statistics
export const getStats = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalItems,
      statusCounts,
    };
  },
});

// Get orders by status (for filtering)
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("collected"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    }));
  },
});

// OPTIMIZED: Get orders by collection point and status using composite index
export const getByCollectionPointAndStatus = query({
  args: {
    collectionPoint: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("collected"),
      v.literal("cancelled")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    // Uses composite index - much faster than filtering after query!
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_collection_point_status", (q) =>
        q.eq("collectionPoint", args.collectionPoint).eq("status", args.status)
      )
      .order("desc")
      .take(limit);

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      statusUpdatedAt: order.statusUpdatedAt,
      itemCount: order.itemCount,
      totalQuantity: order.totalQuantity,
      items: order.items,
    }));
  },
});

// Get recent orders for a collection point (optimized with composite index)
export const getRecentByCollectionPoint = query({
  args: {
    collectionPoint: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    // Uses composite index for faster sorting by creation date
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_collection_point_created", (q) =>
        q.eq("collectionPoint", args.collectionPoint)
      )
      .order("desc")
      .take(limit);

    return orders.map((order) => ({
      orderId: order.orderId,
      username: order.username,
      collectionPoint: order.collectionPoint,
      status: order.status,
      createdAt: order.createdAt,
      statusUpdatedAt: order.statusUpdatedAt,
      itemCount: order.itemCount,
      totalQuantity: order.totalQuantity,
      items: order.items,
    }));
  },
});
