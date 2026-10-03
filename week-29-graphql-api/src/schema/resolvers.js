const { randomUUID } = require("crypto");
const { read, withDb } = require("../data/store");

function notFound(msg) {
  throw new Error(msg);
}

const resolvers = {
  Query: {
    users: () => read().users,
    user: (_, { id }) => read().users.find((u) => u.id === id) || null,

    posts: (_, { tag, authorId, q }) => {
      let posts = [...read().posts];
      if (authorId) posts = posts.filter((p) => p.authorId === authorId);
      if (tag) {
        const t = tag.toLowerCase();
        posts = posts.filter((p) => (p.tags || []).some((x) => x.toLowerCase() === t));
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

    post: (_, { id }) => read().posts.find((p) => p.id === id) || null,

    comments: (_, { postId }) => {
      let comments = [...read().comments];
      if (postId) comments = comments.filter((c) => c.postId === postId);
      comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return comments;
    },

    comment: (_, { id }) => read().comments.find((c) => c.id === id) || null,
  },

  User: {
    posts: (user) => read().posts.filter((p) => p.authorId === user.id),
    comments: (user) => read().comments.filter((c) => c.authorId === user.id),
  },

  Post: {
    author: (post) => read().users.find((u) => u.id === post.authorId) || null,
    comments: (post) =>
      read().comments.filter((c) => c.postId === post.id),
    commentCount: (post) =>
      read().comments.filter((c) => c.postId === post.id).length,
  },

  Comment: {
    author: (comment) =>
      read().users.find((u) => u.id === comment.authorId) || null,
    post: (comment) =>
      read().posts.find((p) => p.id === comment.postId) || null,
  },

  Mutation: {
    createUser: (_, { name, email, bio }) => {
      return withDb((db) => {
        if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          notFound("Email already registered");
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
      });
    },

    updateUser: (_, { id, name, email, bio }) => {
      return withDb((db) => {
        const idx = db.users.findIndex((u) => u.id === id);
        if (idx === -1) notFound("User not found");
        if (email !== undefined) {
          const taken = db.users.some(
            (u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
          );
          if (taken) notFound("Email already registered");
          db.users[idx].email = email.trim().toLowerCase();
        }
        if (name !== undefined) db.users[idx].name = name.trim();
        if (bio !== undefined) db.users[idx].bio = bio.trim();
        return db.users[idx];
      });
    },

    deleteUser: (_, { id }) => {
      return withDb((db) => {
        const idx = db.users.findIndex((u) => u.id === id);
        if (idx === -1) return { success: false, id: null };
        db.users.splice(idx, 1);
        const postIds = db.posts.filter((p) => p.authorId === id).map((p) => p.id);
        db.posts = db.posts.filter((p) => p.authorId !== id);
        db.comments = db.comments.filter(
          (c) => c.authorId !== id && !postIds.includes(c.postId)
        );
        return { success: true, id };
      });
    },

    createPost: (_, { authorId, title, content, tags }) => {
      return withDb((db) => {
        if (!db.users.some((u) => u.id === authorId)) notFound("Author not found");
        const now = new Date().toISOString();
        const post = {
          id: randomUUID(),
          authorId,
          title: title.trim(),
          content: content.trim(),
          tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
          createdAt: now,
          updatedAt: now,
        };
        db.posts.push(post);
        return post;
      });
    },

    updatePost: (_, { id, title, content, tags }) => {
      return withDb((db) => {
        const idx = db.posts.findIndex((p) => p.id === id);
        if (idx === -1) notFound("Post not found");
        if (title !== undefined) db.posts[idx].title = title.trim();
        if (content !== undefined) db.posts[idx].content = content.trim();
        if (tags !== undefined) {
          db.posts[idx].tags = Array.isArray(tags)
            ? tags.map((t) => String(t).trim()).filter(Boolean)
            : [];
        }
        db.posts[idx].updatedAt = new Date().toISOString();
        return db.posts[idx];
      });
    },

    deletePost: (_, { id }) => {
      return withDb((db) => {
        const idx = db.posts.findIndex((p) => p.id === id);
        if (idx === -1) return { success: false, id: null };
        db.posts.splice(idx, 1);
        db.comments = db.comments.filter((c) => c.postId !== id);
        return { success: true, id };
      });
    },

    createComment: (_, { postId, authorId, content }) => {
      return withDb((db) => {
        if (!db.posts.some((p) => p.id === postId)) notFound("Post not found");
        if (!db.users.some((u) => u.id === authorId)) notFound("Author not found");
        const comment = {
          id: randomUUID(),
          postId,
          authorId,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };
        db.comments.push(comment);
        return comment;
      });
    },

    updateComment: (_, { id, content }) => {
      return withDb((db) => {
        const idx = db.comments.findIndex((c) => c.id === id);
        if (idx === -1) notFound("Comment not found");
        db.comments[idx].content = content.trim();
        return db.comments[idx];
      });
    },

    deleteComment: (_, { id }) => {
      return withDb((db) => {
        const idx = db.comments.findIndex((c) => c.id === id);
        if (idx === -1) return { success: false, id: null };
        db.comments.splice(idx, 1);
        return { success: true, id };
      });
    },
  },
};

module.exports = { resolvers };
