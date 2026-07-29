import { z } from "zod";
import { emailResponseSchema } from "./emails";

export const dailyActivitySchema = z.object({
  date: z.string(),
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  failed: z.number().int().min(0),
});

export type DailyActivity = z.infer<typeof dailyActivitySchema>;

export const dashboardStatsSchema = z.object({
  totalEmails: z.number().int().min(0),
  sentToday: z.number().int().min(0),
  delivered: z.number().int().min(0),
  failed: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(100),
  activeTemplates: z.number().int().min(0),
  recentActivity: z.array(dailyActivitySchema),
  recentEmails: z.array(emailResponseSchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
