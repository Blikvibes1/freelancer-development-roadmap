/**
 * Quill GraphQL — Week 29
 * Blog API rebuilt with GraphQL schema + resolvers + nested fields.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { buildSchema } = require("graphql");
const { createHandler } = require("graphql-http/lib/use/express");

const { typeDefs } = require("./schema/typeDefs");
const { resolvers } = require("./schema/resolvers");
const { read } = require("./data/store");

// graphql-http expects a GraphQLSchema from graphql
// buildSchema only supports SDL without resolvers — use makeExecutable-style manually
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} = require("graphql");

const { randomUUID } = require("crypto");
const { withDb } = require("./data/store");

// --- Types (explicit for graphql package without graphql-tools) ---

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    bio: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))),
      resolve: (user) => read().posts.filter((p) => p.authorId === user.id),
    },
    comments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentType))),
      resolve: (user) => read().comments.filter((c) => c.authorId === user.id),
    },
  }),
});

const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
    },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: new GraphQLNonNull(GraphQLString) },
    author: {
      type: UserType,
      resolve: (post) => read().users.find((u) => u.id === post.authorId) || null,
    },
    comments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentType))),
      resolve: (post) => read().comments.filter((c) => c.postId === post.id),
    },
    commentCount: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: (post) => read().comments.filter((c) => c.postId === post.id).length,
    },
  }),
});

const CommentType = new GraphQLObjectType({
  name: "Comment",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    author: {
      type: UserType,
      resolve: (comment) =>
        read().users.find((u) => u.id === comment.authorId) || null,
    },
    post: {
      type: PostType,
      resolve: (comment) =>
        read().posts.find((p) => p.id === comment.postId) || null,
    },
  }),
});

const DeletePayloadType = new GraphQLObjectType({
  name: "DeletePayload",
  fields: {
    success: { type: new GraphQLNonNull(GraphQLBoolean) },
    id: { type: GraphQLID },
  },
});

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
      resolve: () => read().users,
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) => read().users.find((u) => u.id === id) || null,
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))),
      args: {
        tag: { type: GraphQLString },
        authorId: { type: GraphQLID },
        q: { type: GraphQLString },
      },
      resolve: (_, { tag, authorId, q }) => {
        let posts = [...read().posts];
        if (authorId) posts = posts.filter((p) => p.authorId === authorId);
        if (tag) {
          const t = tag.toLowerCase();
          posts = posts.filter((p) =>
            (p.tags || []).some((x) => x.toLowerCase() === t)
          );
        }
        if (q) {
          const term = q.toLowerCase();
          posts = posts.filter(
            (p) =>
              p.title.toLowerCase().includes(term) ||
              p.content.toLowerCase().includes(term)
          );
        }
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return posts;
      },
    },
    post: {
      type: PostType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) => read().posts.find((p) => p.id === id) || null,
    },
    comments: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentType))),
      args: { postId: { type: GraphQLID } },
      resolve: (_, { postId }) => {
        let comments = [...read().comments];
        if (postId) comments = comments.filter((c) => c.postId === postId);
        comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return comments;
      },
    },
    comment: {
      type: CommentType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) => read().comments.find((c) => c.id === id) || null,
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createUser: {
      type: new GraphQLNonNull(UserType),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        bio: { type: GraphQLString },
      },
      resolve: (_, { name, email, bio }) =>
        withDb((db) => {
          if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error("Email already registered");
          }
          const user = {
            id: randomUUID(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            bio: bio ? bio.trim() : "",
            createdAt: new Date().toISOString(),
          };
          db.users.push(user);
          return user;
        }),
    },
    updateUser: {
      type: new GraphQLNonNull(UserType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        bio: { type: GraphQLString },
      },
      resolve: (_, { id, name, email, bio }) =>
        withDb((db) => {
          const idx = db.users.findIndex((u) => u.id === id);
          if (idx === -1) throw new Error("User not found");
          if (email !== undefined && email !== null) {
            const taken = db.users.some(
              (u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
            );
            if (taken) throw new Error("Email already registered");
            db.users[idx].email = email.trim().toLowerCase();
          }
          if (name !== undefined && name !== null) db.users[idx].name = name.trim();
          if (bio !== undefined && bio !== null) db.users[idx].bio = bio.trim();
          return db.users[idx];
        }),
    },
    deleteUser: {
      type: new GraphQLNonNull(DeletePayloadType),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) =>
        withDb((db) => {
          const idx = db.users.findIndex((u) => u.id === id);
          if (idx === -1) return { success: false, id: null };
          db.users.splice(idx, 1);
          const postIds = db.posts.filter((p) => p.authorId === id).map((p) => p.id);
          db.posts = db.posts.filter((p) => p.authorId !== id);
          db.comments = db.comments.filter(
            (c) => c.authorId !== id && !postIds.includes(c.postId)
          );
          return { success: true, id };
        }),
    },
    createPost: {
      type: new GraphQLNonNull(PostType),
      args: {
        authorId: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: (_, { authorId, title, content, tags }) =>
        withDb((db) => {
          if (!db.users.some((u) => u.id === authorId)) {
            throw new Error("Author not found");
          }
          const now = new Date().toISOString();
          const post = {
            id: randomUUID(),
            authorId,
            title: title.trim(),
            content: content.trim(),
            tags: Array.isArray(tags)
              ? tags.map((t) => String(t).trim()).filter(Boolean)
              : [],
            createdAt: now,
            updatedAt: now,
          };
          db.posts.push(post);
          return post;
        }),
    },
    updatePost: {
      type: new GraphQLNonNull(PostType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
        tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
      },
      resolve: (_, { id, title, content, tags }) =>
        withDb((db) => {
          const idx = db.posts.findIndex((p) => p.id === id);
          if (idx === -1) throw new Error("Post not found");
          if (title != null) db.posts[idx].title = title.trim();
          if (content != null) db.posts[idx].content = content.trim();
          if (tags !== undefined) {
            db.posts[idx].tags = Array.isArray(tags)
              ? tags.map((t) => String(t).trim()).filter(Boolean)
              : [];
          }
          db.posts[idx].updatedAt = new Date().toISOString();
          return db.posts[idx];
        }),
    },
    deletePost: {
      type: new GraphQLNonNull(DeletePayloadType),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) =>
        withDb((db) => {
          const idx = db.posts.findIndex((p) => p.id === id);
          if (idx === -1) return { success: false, id: null };
          db.posts.splice(idx, 1);
          db.comments = db.comments.filter((c) => c.postId !== id);
          return { success: true, id };
        }),
    },
    createComment: {
      type: new GraphQLNonNull(CommentType),
      args: {
        postId: { type: new GraphQLNonNull(GraphQLID) },
        authorId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (_, { postId, authorId, content }) =>
        withDb((db) => {
          if (!db.posts.some((p) => p.id === postId)) throw new Error("Post not found");
          if (!db.users.some((u) => u.id === authorId)) {
            throw new Error("Author not found");
          }
          const comment = {
            id: randomUUID(),
            postId,
            authorId,
            content: content.trim(),
            createdAt: new Date().toISOString(),
          };
          db.comments.push(comment);
          return comment;
        }),
    },
    updateComment: {
      type: new GraphQLNonNull(CommentType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (_, { id, content }) =>
        withDb((db) => {
          const idx = db.comments.findIndex((c) => c.id === id);
          if (idx === -1) throw new Error("Comment not found");
          db.comments[idx].content = content.trim();
          return db.comments[idx];
        }),
    },
    deleteComment: {
      type: new GraphQLNonNull(DeletePayloadType),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_, { id }) =>
        withDb((db) => {
          const idx = db.comments.findIndex((c) => c.id === id);
          if (idx === -1) return { success: false, id: null };
          db.comments.splice(idx, 1);
          return { success: true, id };
        }),
    },
  },
});

const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

// Keep SDL file as documentation; runtime uses GraphQLSchema above
void typeDefs;
void resolvers;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Quill GraphQL Blog API",
    version: "1.0.0",
    phase: "Week 29 · Phase 3",
    graphql: "/graphql",
    note: "POST GraphQL queries to /graphql",
  });
});

app.get("/api/health", (req, res) => {
  const db = read();
  res.json({
    status: "ok",
    users: db.users.length,
    posts: db.posts.length,
    comments: db.comments.length,
  });
});

// GraphiQL-less endpoint (use curl, Altair, or Insomnia)
app.all(
  "/graphql",
  createHandler({
    schema,
  })
);

// Simple browser landing with example query
app.get("/playground", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quill GraphQL — examples</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code, pre { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 4px; }
    pre { padding: 1rem; overflow: auto; }
  </style>
</head>
<body>
  <h1>Quill GraphQL</h1>
  <p>POST to <code>/graphql</code>. Nested query example:</p>
  <pre>{
  posts {
    title
    author { name email }
    comments {
      content
      author { name }
    }
    commentCount
  }
}</pre>
  <p>Or open your GraphQL client at <code>http://localhost:${PORT}/graphql</code>.</p>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Quill GraphQL at http://localhost:${PORT}/graphql`);
  console.log(`Examples: http://localhost:${PORT}/playground`);
});
