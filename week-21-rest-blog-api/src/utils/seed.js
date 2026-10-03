/**
 * Seed sample users, posts, and comments.
 * Run: npm run seed
 */

const { randomUUID } = require("crypto");
const { write } = require("../data/store");

const now = new Date().toISOString();

const users = [
  {
    id: randomUUID(),
    name: "Ava Chen",
    email: "ava@example.com",
    bio: "Designer who codes.",
    createdAt: now,
  },
  {
    id: randomUUID(),
    name: "Jordan Lee",
    email: "jordan@example.com",
    bio: "Full-stack builder.",
    createdAt: now,
  },
  {
    id: randomUUID(),
    name: "Sam Okonkwo",
    email: "sam@example.com",
    bio: "API enthusiast.",
    createdAt: now,
  },
];

const posts = [
  {
    id: randomUUID(),
    authorId: users[0].id,
    title: "Shipping beats perfect",
    content:
      "The best way to learn is to ship small things often. Polish comes after feedback, not before the first release.",
    tags: ["product", "mindset"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    authorId: users[1].id,
    title: "REST design that scales",
    content:
      "Clear resource names, consistent status codes, and predictable error shapes make APIs a joy to consume.",
    tags: ["api", "rest"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    authorId: users[2].id,
    title: "Why I still write plain Node",
    content:
      "Frameworks are great. Understanding the request cycle without them is better. Start simple, add complexity when it pays rent.",
    tags: ["node", "backend"],
    createdAt: now,
    updatedAt: now,
  },
];

const comments = [
  {
    id: randomUUID(),
    postId: posts[0].id,
    authorId: users[1].id,
    content: "This is the reminder I needed this week.",
    createdAt: now,
  },
  {
    id: randomUUID(),
    postId: posts[0].id,
    authorId: users[2].id,
    content: "Ship yard. Iterate. Repeat.",
    createdAt: now,
  },
  {
    id: randomUUID(),
    postId: posts[1].id,
    authorId: users[0].id,
    content: "Status codes and error envelopes are underrated.",
    createdAt: now,
  },
];

write({ users, posts, comments });
console.log(
  "Seeded db.json with",
  users.length,
  "users,",
  posts.length,
  "posts,",
  comments.length,
  "comments."
);
