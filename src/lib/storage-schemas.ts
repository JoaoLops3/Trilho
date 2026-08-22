import { z } from "zod";

/** YYYY-MM-DD em horário local. */
export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** HH:mm no relógio de 24h. */
export const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/);

export const taskStatusSchema = z.enum([
  "active",
  "pending",
  "paused",
  "completed",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  duration: z.number().finite().nonnegative(),
  elapsed: z.number().finite().nonnegative(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  scheduledTime: timeOfDaySchema.optional(),
  scheduledDate: dayKeySchema.optional(),
  completedAt: z.string().optional(),
  routineTemplateId: z.string().optional(),
  routineDate: dayKeySchema.optional(),
});

export const routineTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  duration: z.number().finite().nonnegative(),
  priority: taskPrioritySchema,
  scheduledTime: timeOfDaySchema.optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  active: z.boolean(),
  createdAt: z.string(),
});

export const dayStatSchema = z.object({
  date: dayKeySchema,
  tasksCompleted: z.number().int().nonnegative(),
  focusSeconds: z.number().finite().nonnegative(),
});

export const notificationTypeSchema = z.enum([
  "task_upcoming",
  "task_completed",
  "daily_goal_reached",
  "streak_milestone",
  "streak_at_risk",
  "task_overdue",
  "timer_finished",
]);

export const appNotificationSchema = z.object({
  id: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  dedupKey: z.string(),
  taskId: z.string().optional(),
});

export const leadMinutesSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
]);

export const notificationPreferencesSchema = z.object({
  leadMinutes: leadMinutesSchema,
  hideTaskContent: z.boolean(),
  enabled: z.object({
    task_upcoming: z.boolean(),
    task_completed: z.boolean(),
    daily_goal_reached: z.boolean(),
    streak_milestone: z.boolean(),
    streak_at_risk: z.boolean(),
    task_overdue: z.boolean(),
    timer_finished: z.boolean(),
  }),
});

export const avatarStyleSchema = z.literal("toon-head");

export const userProfileSchema = z.object({
  accountName: z.string(),
  nickname: z.string().nullable(),
  avatarSeed: z.string().nullable(),
  avatarStyle: avatarStyleSchema,
  dailyGoalMinutes: z.number().positive(),
});
