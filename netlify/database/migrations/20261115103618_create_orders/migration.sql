CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"location" text NOT NULL,
	"delivery_date" date NOT NULL,
	"qty_ayam" integer DEFAULT 0 NOT NULL,
	"qty_udang" integer DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"subtotal" integer NOT NULL,
	"delivery" integer NOT NULL,
	"total" integer NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
