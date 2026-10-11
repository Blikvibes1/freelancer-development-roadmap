const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3061;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
app.use(express.static(path.join(__dirname, "..", "public")));
const users = new Map();
const history = new Map();
function roomUsers(room) { return [...users.values()].filter((u) => u.room === room); }
function pushHistory(room, msg) {
  const list = history.get(room) || [];
  list.push(msg);
  if (list.length > 100) list.shift();
  history.set(room, list);
}
io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, ack) => {
    const cleanName = String(name || "Guest").trim().slice(0, 32) || "Guest";
    const cleanRoom = String(room || "general").trim().slice(0, 32) || "general";
    users.set(socket.id, { id: socket.id, name: cleanName, room: cleanRoom });
    socket.join(cleanRoom);
    socket.emit("history", history.get(cleanRoom) || []);
    socket.to(cleanRoom).emit("system", { text: `${cleanName} joined`, at: Date.now() });
    io.to(cleanRoom).emit("presence", roomUsers(cleanRoom));
    if (typeof ack === "function") ack({ ok: true, self: { id: socket.id, name: cleanName, room: cleanRoom } });
  });
  socket.on("message", (payload, ack) => {
    const user = users.get(socket.id);
    if (!user) return;
    const text = String(payload?.text || "").trim().slice(0, 2000);
    if (!text) return;
    const msg = {
      id: `${Date.now()}-${socket.id.slice(0, 6)}`,
      room: user.room,
      from: { id: user.id, name: user.name },
      text, at: Date.now(), deliveredTo: [], readBy: [user.id],
    };
    pushHistory(user.room, msg);
    io.to(user.room).emit("message", msg);
    if (typeof ack === "function") ack({ ok: true, id: msg.id });
  });
  socket.on("typing", (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(user.room).emit("typing", { id: user.id, name: user.name, typing: !!isTyping });
  });
  socket.on("delivered", ({ messageId }) => {
    const user = users.get(socket.id);
    if (!user || !messageId) return;
    const list = history.get(user.room) || [];
    const msg = list.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.deliveredTo.includes(user.id)) msg.deliveredTo.push(user.id);
    io.to(user.room).emit("receipt", { messageId, deliveredTo: msg.deliveredTo, readBy: msg.readBy });
  });
  socket.on("read", ({ messageId }) => {
    const user = users.get(socket.id);
    if (!user || !messageId) return;
    const list = history.get(user.room) || [];
    const msg = list.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.deliveredTo.includes(user.id)) msg.deliveredTo.push(user.id);
    if (!msg.readBy.includes(user.id)) msg.readBy.push(user.id);
    io.to(user.room).emit("receipt", { messageId, deliveredTo: msg.deliveredTo, readBy: msg.readBy });
  });
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) return;
    users.delete(socket.id);
    socket.to(user.room).emit("system", { text: `${user.name} left`, at: Date.now() });
    io.to(user.room).emit("presence", roomUsers(user.room));
    socket.to(user.room).emit("typing", { id: user.id, name: user.name, typing: false });
  });
});
server.listen(PORT, () => console.log(`Relay → http://localhost:${PORT}`));
