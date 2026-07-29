import type { DailyActivity, DashboardStats } from "@andersseen/contracts";
import { mapEmailRow } from "../mappers";
import type { EmailRow } from "../rows";
import { FROM_EMAILS, SELECT_EMAIL_COLUMNS } from "./emails";

const RECENT_ACTIVITY_DAYS = 7;
const RECENT_EMAILS_LIMIT = 5;

interface CountRow {
  total: number;
  sent_today: number;
  delivered: number;
  failed: number;
}

interface ActivityRow {
  day: string;
  sent: number;
  delivered: number;
  failed: number;
}

function lastNDays(days: number): string[] {
  const result: string[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    result.push(date.toISOString().slice(0, 10));
  }
  return result;
}

export async function getDashboardStats(
  db: D1Database,
  projectId: string,
): Promise<DashboardStats> {
  const countsRow = await db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('sent', 'delivered') AND date(created_at) = date('now') THEN 1 ELSE 0 END) AS sent_today,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM emails
       WHERE project_id = ?1`,
    )
    .bind(projectId)
    .first<CountRow>();

  const total = countsRow?.total ?? 0;
  const delivered = countsRow?.delivered ?? 0;
  const failed = countsRow?.failed ?? 0;
  const sentToday = countsRow?.sent_today ?? 0;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0;

  const templatesCountRow = await db
    .prepare("SELECT COUNT(*) AS count FROM templates WHERE project_id = ?1")
    .bind(projectId)
    .first<{ count: number }>();
  const activeTemplates = templatesCountRow?.count ?? 0;

  const activityResult = await db
    .prepare(
      `SELECT
         date(created_at) AS day,
         SUM(CASE WHEN status IN ('sent', 'delivered') THEN 1 ELSE 0 END) AS sent,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM emails
       WHERE project_id = ?1 AND date(created_at) >= date('now', '-${RECENT_ACTIVITY_DAYS - 1} days')
       GROUP BY day`,
    )
    .bind(projectId)
    .all<ActivityRow>();

  const activityByDay = new Map(activityResult.results.map((row) => [row.day, row]));
  const recentActivity: DailyActivity[] = lastNDays(RECENT_ACTIVITY_DAYS).map((day) => {
    const row = activityByDay.get(day);
    return {
      date: day,
      sent: row?.sent ?? 0,
      delivered: row?.delivered ?? 0,
      failed: row?.failed ?? 0,
    };
  });

  const recentEmailsResult = await db
    .prepare(
      `SELECT ${SELECT_EMAIL_COLUMNS} ${FROM_EMAILS}
       WHERE emails.project_id = ?1
       ORDER BY emails.created_at DESC
       LIMIT ${RECENT_EMAILS_LIMIT}`,
    )
    .bind(projectId)
    .all<EmailRow>();

  return {
    totalEmails: total,
    sentToday,
    delivered,
    failed,
    deliveryRate,
    activeTemplates,
    recentActivity,
    recentEmails: recentEmailsResult.results.map(mapEmailRow),
  };
}
