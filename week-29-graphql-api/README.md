# Quill GraphQL — Week 29 GraphQL Blog API

Blog domain (users, posts, comments) rebuilt with **GraphQL**: schema, resolvers, and nested queries.

## Purpose

Week 29 of the Freelancer 100-week development program.  
Roadmap requirement: **GraphQL API — rebuild the Blog API with schemas, resolvers, and nested queries.**

## Features

- GraphQL endpoint at `POST /graphql`
- Types: `User`, `Post`, `Comment`
- Nested fields: `post.author`, `post.comments`, `user.posts`, `comment.author`
- Queries with filters: `posts(tag, authorId, q)`
- Full mutations for create / update / delete
- Same JSON file store pattern as Week 21 REST API
- Seed script

## Setup

```bash
cd week-29-graphql-api
npm install
npm run seed
npm start
```

## Nested query example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ posts { title author { name email } comments { content author { name } } commentCount } }"}'
```

## Mutations

```bash
# Create user
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createUser(name: \"Ada\", email: \"ada@example.com\") { id name } }"}'
```

## Schema (overview)

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  comments: [Comment!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  tags: [String!]!
  author: User
  comments: [Comment!]!
  commentCount: Int!
}

type Query {
  users: [User!]!
  posts(tag: String, authorId: ID, q: String): [Post!]!
  post(id: ID!): Post
  # ...
}

type Mutation {
  createPost(authorId: ID!, title: String!, content: String!, tags: [String!]): Post!
  # ...
}
```

Full SDL: `src/schema/typeDefs.js`

## Project structure

```
week-29-graphql-api/
├── package.json
├── README.md
├── data/db.json
└── src/
    ├── server.js          ← GraphQLSchema + express
    ├── schema/
    │   ├── typeDefs.js    ← SDL documentation
    │   └── resolvers.js   ← reference resolvers
    ├── data/store.js
    └── utils/seed.js
```

## Concepts

- Schema vs resolvers
- Nested field resolution
- One request, many resources (vs REST waterfalls)
- Mutations vs queries

---

**Freelancer Development Program · Phase 3 · Week 29**
