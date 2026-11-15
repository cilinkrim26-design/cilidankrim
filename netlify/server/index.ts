import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db } from "../../db/index.ts";
import { orders } from "../../db/schema.ts";
import { adminPage } from "./admin.ts";

// Prices and rules live on the server so the totals can't be changed from the browser.
const PRICES = { ayam: 12, udang: 15 };
const MIN_QTY = 2;
const DELIVERY_FEE = 8;
const FREE_DELIVERY_ABOVE = 10;
const AREAS = [
  "Shah Alam", "Subang Jaya", "Glenmarie", "Sunway", "Puchong",
  "Bukit Jalil", "Kinrara", "Others - we will verify with u :)",
];
const STATUSES = ["new", "confirmed", "paid", "delivered", "cancelled"];

const orderNo = (id: number) => `CK-${String(id).padStart(4, "0")}`;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 500 ? (v as number) : -1);

const app = new Hono();

app.post("/api/orders", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request." }, 400);
  }

  const name = str(body.name, 100);
  const phone = str(body.phone, 30);
  const location = str(body.location, 100);
  const deliveryDate = str(body.deliveryDate, 10);
  const note = str(body.note, 1000);
  const qtyAyam = int(body.qtyAyam);
  const qtyUdang = int(body.qtyUdang);

  if (qtyAyam < 0 || qtyUdang < 0) return c.json({ error: "Invalid quantity." }, 400);
  const qty = qtyAyam + qtyUdang;
  if (qty < MIN_QTY) return c.json({ error: `Minimum order is ${MIN_QTY} bekas.` }, 400);
  if (!name || !phone || !location || !deliveryDate)
    return c.json({ error: "Please fill in name, phone, location and date." }, 400);
  if (!AREAS.includes(location)) return c.json({ error: "Please choose a delivery area." }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || Number.isNaN(Date.parse(deliveryDate)))
    return c.json({ error: "Please choose a valid delivery date." }, 400);

  const subtotal = qtyAyam * PRICES.ayam + qtyUdang * PRICES.udang;
  const delivery = qty > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;

  const [row] = await db
    .insert(orders)
    .values({ name, phone, location, deliveryDate, qtyAyam, qtyUdang, note, subtotal, delivery, total: subtotal + delivery })
    .returning();

  return c.json({ orderNo: orderNo(row.id), total: row.total, delivery: row.delivery }, 201);
});

// ---- Seller admin (HTTP Basic Auth, password from ADMIN_PASSWORD) ----
const adminAuth = async (c: any, next: () => Promise<void>) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return c.text("Admin password is not configured.", 503);
  const header = c.req.header("authorization") || "";
  let given = "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString();
    given = decoded.slice(decoded.indexOf(":") + 1);
  }
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return c.text("Login required.", 401, { "WWW-Authenticate": 'Basic realm="Cili & Krim admin"' });
  }
  await next();
};

app.use("/admin", adminAuth);
app.use("/api/admin/*", adminAuth);

app.get("/admin", (c) => c.html(adminPage));

app.get("/api/admin/orders", async (c) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(500);
  return c.json(rows.map((r) => ({ ...r, orderNo: orderNo(r.id) })));
});

app.patch("/api/admin/orders/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json().catch(() => ({}));
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return c.json({ error: "Invalid update." }, 400);
  const [row] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  if (!row) return c.json({ error: "Order not found." }, 404);
  return c.json({ ok: true });
});

export default app;

export const config = {
  path: ["/api/*", "/admin"],
};
