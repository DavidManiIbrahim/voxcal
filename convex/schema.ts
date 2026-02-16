import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    title: v.string(),
    startDate: v.string(), // ISO string
    endDate: v.string(), // ISO string
    isAllDay: v.boolean(),
    notes: v.optional(v.string()),
    alarmId: v.optional(v.string()),
    reminderType: v.optional(v.string()), // 'voice' | 'standard'
    sound: v.optional(v.string()),
  }),
});
