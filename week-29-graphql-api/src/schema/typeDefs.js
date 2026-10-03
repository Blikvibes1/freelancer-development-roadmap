const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    bio: String
    createdAt: String!
    posts: [Post!]!
    comments: [Comment!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
    author: User
    comments: [Comment!]!
    commentCount: Int!
  }

  type Comment {
    id: ID!
    content: String!
    createdAt: String!
    author: User
    post: Post
  }

  type DeletePayload {
    success: Boolean!
    id: ID
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts(tag: String, authorId: ID, q: String): [Post!]!
    post(id: ID!): Post
    comments(postId: ID): [Comment!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    createUser(name: String!, email: String!, bio: String): User!
    updateUser(id: ID!, name: String, email: String, bio: String): User!
    deleteUser(id: ID!): DeletePayload!

    createPost(authorId: ID!, title: String!, content: String!, tags: [String!]): Post!
    updatePost(id: ID!, title: String, content: String, tags: [String!]): Post!
    deletePost(id: ID!): DeletePayload!

    createComment(postId: ID!, authorId: ID!, content: String!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): DeletePayload!
  }
`;

module.exports = { typeDefs };
