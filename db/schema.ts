import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const dailyVisitors = sqliteTable('daily_visitors', {
  day: text('day').notNull(),
  visitorId: text('visitor_id').notNull(),
}, table => [primaryKey({ columns: [table.day, table.visitorId] })]);
