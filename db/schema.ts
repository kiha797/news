import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const dailyVisitors = sqliteTable('daily_visitors', {
  day: text('day').notNull(),
  visitorId: text('visitor_id').notNull(),
  ipAddress: text('ip_address'),
  visitedAt: text('visited_at'),
}, table => [primaryKey({ columns: [table.day, table.visitorId] })]);

export const visitorAdminAttempts = sqliteTable('visitor_admin_attempts', {
  ipAddress: text('ip_address').primaryKey(),
  windowStart: integer('window_start').notNull(),
  failures: integer('failures').notNull(),
});
