import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create user
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"))),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      clerkId: args.clerkId,
      role: args.role || "customer",
      phone: args.phone,
    });
    return userId;
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    addresses: v.optional(
      v.array(
        v.object({
          street: v.string(),
          city: v.string(),
          state: v.string(),
          zipCode: v.string(),
          isDefault: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Add address
export const addAddress = mutation({
  args: {
    userId: v.id("users"),
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const newAddress = {
      street: args.street,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      isDefault: args.isDefault,
    };

    let addresses = user.addresses || [];
    
    // If this is set as default, remove default from others
    if (args.isDefault) {
      addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
    }

    addresses.push(newAddress);

    await ctx.db.patch(args.userId, { addresses });
  },
});

// Get or create a default guest user (for development without auth)
export const getOrCreateGuest = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "guest@freshcart.dev"))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: "guest@freshcart.dev",
      name: "Guest User",
      clerkId: "guest",
      role: "customer",
    });
  },
});

// Get all users (Admin)
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Create test users for bulk orders (Admin)
export const createTestUsers = mutation({
  handler: async (ctx) => {
    const testUsers = [
      {
        email: "user@example.com",
        name: "Test User",
        clerkId: "test-user-1",
        role: "customer" as const,
      },
      {
        email: "customer@test.com",
        name: "Customer Test",
        clerkId: "test-user-2",
        role: "customer" as const,
      },
      {
        email: "john@email.com",
        name: "John Doe",
        clerkId: "test-user-3",
        role: "customer" as const,
      },
    ];

    let created = 0;
    let existing = 0;

    for (const userData of testUsers) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", userData.email))
        .first();

      if (!user) {
        await ctx.db.insert("users", userData);
        created++;
      } else {
        existing++;
      }
    }

    return {
      message: `Test users ready: ${created} created, ${existing} already existed`,
      created,
      existing,
    };
  },
});
