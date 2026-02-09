import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create order
export const create = mutation({
  args: {
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        image: v.string(),
      })
    ),
    subtotal: v.number(),
    tax: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    deliveryAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
    }),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create order
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Update product stock
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: product.stock - item.quantity,
        });
      }
    }

    // Clear user's cart
    const cartItems = await ctx.db
      .query("cart")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return orderId;
  },
});

// Get user's orders
export const getUserOrders = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get order by ID
export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Get user details
    const user = await ctx.db.get(order.userId);
    
    return {
      ...order,
      user,
    };
  },
});

// Get all orders (Admin)
export const listAll = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("preparing"),
        v.literal("out_for_delivery"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db.query("orders").order("desc").collect();
    }

    // Get user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          user,
        };
      })
    );

    return ordersWithUsers;
  },
});

// Update order status
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get order statistics (Admin)
export const getStats = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get orders from last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter((o) => o.createdAt > thirtyDaysAgo);

    return {
      totalOrders,
      totalRevenue,
      statusCounts,
      recentOrdersCount: recentOrders.length,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  },
});

// Create bulk orders from CSV data (Admin)
export const createBulkOrders = mutation({
  args: {
    orders: v.array(
      v.object({
        userEmail: v.string(),
        items: v.array(
          v.object({
            productName: v.string(),
            quantity: v.number(),
          })
        ),
        deliveryAddress: v.object({
          street: v.string(),
          city: v.string(),
          state: v.string(),
          zipCode: v.string(),
        }),
        paymentMethod: v.string(),
        status: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("out_for_delivery"),
            v.literal("delivered"),
            v.literal("cancelled")
          )
        ),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const orderData of args.orders) {
      try {
        // Find user by email
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", orderData.userEmail))
          .first();

        if (!user) {
          results.failed++;
          results.errors.push(`User not found: ${orderData.userEmail}`);
          continue;
        }

        // Build order items by looking up products
        const orderItems = [];
        let subtotal = 0;

        for (const item of orderData.items) {
          // Find product by name
          const products = await ctx.db.query("products").collect();
          const product = products.find((p) => p.name === item.productName);

          if (!product) {
            results.failed++;
            results.errors.push(
              `Product not found: ${item.productName} for order ${orderData.userEmail}`
            );
            continue;
          }

          // Check stock
          if (product.stock < item.quantity) {
            results.failed++;
            results.errors.push(
              `Insufficient stock for ${item.productName}: ${product.stock} available, ${item.quantity} requested`
            );
            continue;
          }

          orderItems.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.image,
          });

          subtotal += product.price * item.quantity;
        }

        if (orderItems.length === 0) {
          results.failed++;
          results.errors.push(
            `No valid items for order ${orderData.userEmail}`
          );
          continue;
        }

        // Calculate totals
        const deliveryFee = 40;
        const tax = 0;
        const total = subtotal + deliveryFee + tax;

        // Create the order
        const now = Date.now();
        await ctx.db.insert("orders", {
          userId: user._id,
          items: orderItems,
          subtotal,
          tax,
          deliveryFee,
          total,
          deliveryAddress: orderData.deliveryAddress,
          paymentMethod: orderData.paymentMethod,
          status: orderData.status || "pending",
          notes: orderData.notes,
          createdAt: now,
          updatedAt: now,
        });

        // Update product stock
        for (const item of orderItems) {
          const product = await ctx.db.get(item.productId);
          if (product) {
            await ctx.db.patch(item.productId, {
              stock: product.stock - item.quantity,
            });
          }
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Error processing order for ${orderData.userEmail}: ${error.message}`
        );
      }
    }

    return results;
  },
});
