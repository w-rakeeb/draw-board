import express from "express";
import http from "http";
import { Server } from "socket.io";

const MAX_PACKET_BYTES = 16 * 1024 * 1024;
const MAX_CACHE_BYTES = 128 * 1024 * 1024;
const MAX_ROOMS = 256;
const MAX_PEOPLE = 20;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const origins = (
  process.env.CORS_ORIGIN || "http://localhost:3001,http://127.0.0.1:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
  throw new Error(
    "Set CORS_ORIGIN to your Draw Board website origin before starting the server.",
  );
}

type Packet = { data: Buffer; iv: Buffer };
type Room = { snapshot?: Packet; bytes: number; updated: number };
const rooms = new Map<string, Room>();
let cacheBytes = 0;
const app = express();
app.disable("x-powered-by");
app.get("/", (_req, res) =>
  res.json({ name: "Draw Board collaboration", by: "Wrakeeb", status: "ok" }),
);
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: MAX_PACKET_BYTES + 1024,
  cors: { origin: origins, methods: ["GET", "POST"] },
  // CORS alone does not restrict WebSocket clients.
  allowRequest: (req, callback) =>
    callback(null, !req.headers.origin || origins.includes(req.headers.origin)),
});
const publishMembers = (id: string) => {
  io.to(id).emit("members", Array.from(io.sockets.adapter.rooms.get(id) || []));
};
const prune = () => {
  for (const [id, room] of rooms) {
    if (
      !io.sockets.adapter.rooms.has(id) &&
      Date.now() - room.updated > ROOM_TTL_MS
    ) {
      cacheBytes -= room.bytes;
      rooms.delete(id);
    }
  }
};
const cleanup = setInterval(prune, 60000);
cleanup.unref();
const validPacket = (packet: unknown): packet is Packet => {
  const value = packet as Packet | null;
  return (
    !!value &&
    Buffer.isBuffer(value.data) &&
    Buffer.isBuffer(value.iv) &&
    value.iv.length === 12 &&
    value.data.length >= 16 &&
    value.data.length <= MAX_PACKET_BYTES
  );
};

io.on("connection", (socket) => {
  let roomId: string | null = null;
  const counts = new Map<string, { at: number; count: number }>();
  const allowed = (event: string, limit: number) => {
    const count = counts.get(event);
    if (!count || Date.now() - count.at > 1000) {
      counts.set(event, { at: Date.now(), count: 1 });
      return true;
    }
    return ++count.count <= limit;
  };
  socket.on("join", async (id: unknown, ack: unknown) => {
    if (typeof ack !== "function") {
      return;
    }
    if (
      !allowed("join", 2) ||
      typeof id !== "string" ||
      !/^[a-f0-9]{32}$/.test(id) ||
      (roomId && roomId !== id)
    ) {
      ack({ ok: false, error: "Invalid room request." });
      return;
    }
    prune();
    if (
      (!rooms.has(id) && rooms.size >= MAX_ROOMS) ||
      (io.sockets.adapter.rooms.get(id)?.size || 0) >= MAX_PEOPLE
    ) {
      ack({ ok: false, error: "The room server is full. Try again later." });
      return;
    }
    if (!rooms.has(id)) {
      rooms.set(id, { bytes: 0, updated: Date.now() });
    }
    roomId = id;
    await socket.join(id);
    ack({ ok: true, snapshot: rooms.get(id)!.snapshot });
    publishMembers(id);
  });
  socket.on("scene", (id: unknown, packet: unknown, ack: unknown) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (
      typeof id !== "string" ||
      id !== roomId ||
      !socket.rooms.has(id) ||
      !validPacket(packet) ||
      !allowed("scene", 20)
    ) {
      reply({
        ok: false,
        error: "The room update was rejected. Check its size or reconnect.",
      });
      return;
    }
    const room = rooms.get(id)!;
    const bytes = packet.data.length + packet.iv.length;
    if (cacheBytes - room.bytes + bytes > MAX_CACHE_BYTES) {
      reply({
        ok: false,
        error:
          "The server's room storage is full. Save a file and try again later.",
      });
      return;
    }
    cacheBytes += bytes - room.bytes;
    room.bytes = bytes;
    room.updated = Date.now();
    room.snapshot = {
      data: Buffer.from(packet.data),
      iv: Buffer.from(packet.iv),
    };
    socket.to(id).emit("scene", socket.id, room.snapshot);
    reply({ ok: true });
  });
  socket.on("presence", (id: unknown, packet: unknown) => {
    if (
      typeof id === "string" &&
      id === roomId &&
      socket.rooms.has(id) &&
      validPacket(packet) &&
      packet.data.length < 16384 &&
      allowed("presence", 40)
    ) {
      socket.volatile.to(id).emit("presence", socket.id, packet);
    }
  });
  socket.on("request-sync", (id: unknown) => {
    if (
      typeof id === "string" &&
      id === roomId &&
      socket.rooms.has(id) &&
      allowed("sync", 4)
    ) {
      socket.to(id).emit("sync-requested");
    }
  });
  socket.on("disconnect", () => {
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.updated = Date.now();
      }
      publishMembers(roomId);
    }
  });
});

const port = Number(process.env.PORT || 3002);
server.listen(port, "0.0.0.0", () => {
  const address = server.address();
  const listeningPort =
    address && typeof address === "object" ? address.port : port;
  console.log(`Draw Board collaboration listening on port ${listeningPort}`);
});
const shutdown = () => {
  clearInterval(cleanup);
  io.close();
  server.close();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
