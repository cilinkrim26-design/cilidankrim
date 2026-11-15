import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  name: text().notNull(),
  phone: text().notNull(),
  location: text().notNull(),
  deliveryDate: date("delivery_date").notNull(),
  qtyAyam: integer("qty_ayam").notNull().default(0),
  qtyUdang: integer("qty_udang").notNull().default(0),
  note: text().notNull().default(""),
  subtotal: integer().notNull(),
  delivery: integer().notNull(),
  total: integer().notNull(),
  status: text().notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
