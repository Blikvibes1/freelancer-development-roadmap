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
];

const posts = [
  {
    id: randomUUID(),
    authorId: users[0].id,
    title: "Why GraphQL fits nested UIs",
    content:
      "Clients ask for exactly the shape they need. Posts with authors and comments in one round-trip.",
    tags: ["graphql", "api"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    authorId: users[1].id,
    title: "From REST to GraphQL",
    content:
      "Same domain model, different contract. Resolvers map fields to data sources.",
    tags: ["graphql", "rest"],
    createdAt: now,
    updatedAt: now,
  },
];

const comments = [
  {
    id: randomUUID(),
    postId: posts[0].id,
    authorId: users[1].id,
    content: "Nested queries are the killer feature for me.",
    createdAt: now,
  },
  {
    id: randomUUID(),
    postId: posts[0].id,
    authorId: users[0].id,
    content: "Agree — fewer waterfalls on the client.",
    createdAt: now,
  },
];

write({ users, posts, comments });
console.log("Seeded GraphQL blog data.");
console.log("Open http://localhost:3000/graphql");
