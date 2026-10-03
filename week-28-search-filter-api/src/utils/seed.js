/**
 * Seed a product catalog for search/filter demos.
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const catalog = [
  { name: "Nova Wireless Mouse", category: "Electronics", brand: "LogiTech", price: 29.99, rating: 4.4, stock: 120, tags: ["wireless", "office"], popularity: 890 },
  { name: "Mech Pro Keyboard", category: "Electronics", brand: "Keychron", price: 89.0, rating: 4.7, stock: 45, tags: ["mechanical", "rgb"], popularity: 1200 },
  { name: "CloudBuds ANC", category: "Electronics", brand: "Sony", price: 149.0, rating: 4.5, stock: 30, tags: ["audio", "wireless"], popularity: 2100 },
  { name: "USB-C Hub 7-in-1", category: "Electronics", brand: "Anker", price: 49.0, rating: 4.2, stock: 80, tags: ["usb-c", "travel"], popularity: 650 },
  { name: "Desk Lamp LED", category: "Home", brand: "Lumino", price: 39.0, rating: 4.1, stock: 60, tags: ["lighting", "desk"], popularity: 400 },
  { name: "Ergo Office Chair", category: "Home", brand: "Herman", price: 299.0, rating: 4.6, stock: 12, tags: ["furniture", "office"], popularity: 980 },
  { name: "Ceramic Mug Set", category: "Home", brand: "ClayCo", price: 24.5, rating: 4.0, stock: 200, tags: ["kitchen"], popularity: 320 },
  { name: "Running Shoes X1", category: "Sports", brand: "Nike", price: 119.0, rating: 4.3, stock: 55, tags: ["running", "shoes"], popularity: 1500 },
  { name: "Yoga Mat Pro", category: "Sports", brand: "Lululemon", price: 68.0, rating: 4.5, stock: 40, tags: ["yoga", "fitness"], popularity: 720 },
  { name: "Resistance Bands", category: "Sports", brand: "FitLife", price: 18.0, rating: 4.0, stock: 150, tags: ["fitness"], popularity: 510 },
  { name: "TypeScript Handbook", category: "Books", brand: "OReilly", price: 34.0, rating: 4.8, stock: 25, tags: ["programming", "typescript"], popularity: 880 },
  { name: "Clean Code", category: "Books", brand: "Prentice", price: 32.0, rating: 4.7, stock: 0, tags: ["programming"], popularity: 2400 },
  { name: "Design of Everyday Things", category: "Books", brand: "Basic", price: 18.99, rating: 4.6, stock: 35, tags: ["design", "ux"], popularity: 1100 },
  { name: "Linen Shirt", category: "Fashion", brand: "Uniqlo", price: 39.9, rating: 4.2, stock: 90, tags: ["summer", "casual"], popularity: 600 },
  { name: "Wool Overcoat", category: "Fashion", brand: "Everlane", price: 198.0, rating: 4.4, stock: 8, tags: ["winter"], popularity: 450 },
  { name: "Canvas Tote", category: "Fashion", brand: "Baggu", price: 14.0, rating: 3.9, stock: 300, tags: ["bags"], popularity: 280 },
  { name: "Smart Watch S3", category: "Electronics", brand: "Apple", price: 249.0, rating: 4.6, stock: 22, tags: ["wearable", "fitness"], popularity: 3200 },
  { name: "Portable SSD 1TB", category: "Electronics", brand: "Samsung", price: 99.0, rating: 4.5, stock: 70, tags: ["storage", "usb-c"], popularity: 1400 },
  { name: "Pour-Over Kit", category: "Home", brand: "Fellow", price: 45.0, rating: 4.3, stock: 33, tags: ["coffee", "kitchen"], popularity: 390 },
  { name: "Trail Backpack 30L", category: "Sports", brand: "Osprey", price: 130.0, rating: 4.7, stock: 18, tags: ["hiking", "bags"], popularity: 820 },
];

const now = Date.now();
const products = catalog.map((item, i) => ({
  id: randomUUID(),
  ...item,
  description: `${item.name} by ${item.brand}. Category: ${item.category}.`,
  createdAt: new Date(now - i * 86400000).toISOString(),
}));

write({ products });
console.log("Seeded", products.length, "products.");
console.log('Try: GET /api/products?category=Electronics&min_price=50&sort=price&order=asc');
