/**
 * Seed sample orders for CSV export demos.
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const customers = [
  { name: "Ava Chen", email: "ava@example.com" },
  { name: "Jordan Lee", email: "jordan@example.com" },
  { name: "Sam Okonkwo", email: "sam@example.com" },
  { name: "Riley Park", email: "riley@example.com" },
  { name: "Morgan Díaz", email: "morgan@example.com" },
];

const products = [
  { product: "Wireless Mouse", category: "Electronics", unitPrice: 29.99 },
  { product: "USB-C Hub", category: "Electronics", unitPrice: 49.0 },
  { product: "Notebook Set", category: "Stationery", unitPrice: 12.5 },
  { product: "Desk Lamp", category: "Home", unitPrice: 39.0 },
  { product: "Mechanical Keyboard", category: "Electronics", unitPrice: 89.0 },
  { product: "Water Bottle", category: "Lifestyle", unitPrice: 18.0 },
];

const statuses = ["pending", "paid", "shipped", "cancelled"];

const orders = [];
const now = Date.now();

for (let i = 0; i < 24; i++) {
  const customer = customers[i % customers.length];
  const item = products[i % products.length];
  const quantity = 1 + (i % 4);
  const status = statuses[i % statuses.length];
  const orderedAt = new Date(now - i * 86400000 * 0.7).toISOString();

  orders.push({
    id: "ORD-" + String(1000 + i),
    customer: customer.name,
    email: customer.email,
    product: item.product,
    category: item.category,
    quantity,
    unitPrice: item.unitPrice,
    total: Number((item.unitPrice * quantity).toFixed(2)),
    status,
    orderedAt,
    uuid: randomUUID(),
  });
}

write({ orders });
console.log("Seeded", orders.length, "orders.");
console.log("Try: GET /api/export/orders.csv?status=paid");
