import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEvents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("events").collect();
    },
});

export const addEvent = mutation({
    args: {
        title: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        isAllDay: v.boolean(),
        notes: v.optional(v.string()),
        alarmId: v.optional(v.string()),
        reminderType: v.optional(v.string()),
        sound: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("events", args);
    },
});

export const updateEvent = mutation({
    args: {
        id: v.id("events"),
        title: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        isAllDay: v.boolean(),
        notes: v.optional(v.string()),
        alarmId: v.optional(v.string()),
        reminderType: v.optional(v.string()),
        sound: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest); // Note: patch updates existing fields
    },
});

export const deleteEvent = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
