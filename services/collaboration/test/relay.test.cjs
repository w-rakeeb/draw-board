const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { io } = require("socket.io-client");
const { randomBytes } = require("node:crypto");
let processHandle, url;
const clients = [];
const room = "a".repeat(32);
const packet = { data: randomBytes(100), iv: randomBytes(12) };
const client = async (origin = "https://draw-board.test") => {
  const socket = io(url, { transports: ["websocket"], extraHeaders: { Origin: origin }, reconnection: false, timeout: 1500 });
  clients.push(socket);
  await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
  return socket;
};
before(async () => {
  processHandle = spawn(process.execPath, ["dist/index.js"], { env: { ...process.env, NODE_ENV: "production", PORT: "0", CORS_ORIGIN: "https://draw-board.test" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    processHandle.stdout.once("data", data => { url = `http://127.0.0.1:${String(data).match(/port (\d+)/)[1]}`; resolve(); });
    processHandle.once("error", reject);
    processHandle.stderr.once("data", data => reject(new Error(String(data))));
  });
});
after(() => { clients.forEach(socket => socket.disconnect()); processHandle?.kill(); });
test("branded health endpoint", async () => {
  assert.deepEqual(await (await fetch(url)).json(), { name: "Draw Board collaboration", by: "Wrakeeb", status: "ok" });
});
test("WebSocket origins are restricted", async () => {
  await assert.rejects(client("https://unrelated.test"));
});
test("rejects invalid room IDs", async () => {
  const socket = await client();
  assert.equal((await socket.timeout(2000).emitWithAck("join", "invalid-room")).ok, false);
});
test("non-members cannot broadcast to a room", async () => {
  const socket = await client();
  assert.equal((await socket.timeout(2000).emitWithAck("scene", room, packet)).ok, false);
});
test("forwards ciphertext with server-supplied sender identity and caches late-join state", async () => {
  const sender = await client(), receiver = await client();
  assert.equal((await sender.timeout(2000).emitWithAck("join", room)).ok, true);
  assert.equal((await receiver.timeout(2000).emitWithAck("join", room)).ok, true);
  const received = new Promise(resolve => receiver.once("scene", (id, value) => resolve({ id, value })));
  assert.equal((await sender.timeout(2000).emitWithAck("scene", room, packet)).ok, true);
  const message = await received;
  assert.equal(message.id, sender.id);
  assert.deepEqual(message.value, packet);
  sender.disconnect(); receiver.disconnect();
  const late = await client();
  assert.deepEqual((await late.timeout(2000).emitWithAck("join", room)).snapshot, packet);
});
test("rejects malformed encryption envelopes", async () => {
  const socket = await client();
  await socket.timeout(2000).emitWithAck("join", "b".repeat(32));
  assert.equal((await socket.timeout(2000).emitWithAck("scene", "b".repeat(32), { data: randomBytes(100), iv: randomBytes(2) })).ok, false);
});
test("a member cannot broadcast into another room", async () => {
  const socket = await client();
  await socket.timeout(2000).emitWithAck("join", "c".repeat(32));
  assert.equal((await socket.timeout(2000).emitWithAck("scene", room, packet)).ok, false);
});
