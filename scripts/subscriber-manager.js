/**
 * 로컬 개발용: HTTP 요청을 받아 MQTT 구독 스크립트를 실행.
 * "구독 신청" 버튼 → POST /api/subscriber/start → 이 서버의 /start → mqtt-subscriber.ts 실행.
 *
 * 실행: node scripts/subscriber-manager.js
 * 기본 포트: 3002 (SUBSCRIBER_MANAGER_PORT 환경변수로 변경 가능)
 */

const http = require("http");
const { spawn } = require("child_process");

const PORT = parseInt(process.env.SUBSCRIBER_MANAGER_PORT || "3002", 10);
let subscriberProcess = null;

function startSubscriber() {
  if (subscriberProcess && subscriberProcess.exitCode === null) {
    return { started: false, message: "already running" };
  }
  const child = spawn("npx", ["tsx", "scripts/mqtt-subscriber.ts"], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  subscriberProcess = child;
  child.on("exit", (code) => {
    subscriberProcess = null;
    if (code !== 0 && code !== null) {
      console.error("[subscriber-manager] subscriber exited with code", code);
    }
  });
  child.unref();
  return { started: true, message: "subscriber started" };
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if ((req.method === "GET" || req.method === "POST") && (url === "/start" || url === "/")) {
    const result = startSubscriber();
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(result));
    return;
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("[subscriber-manager] listening on http://127.0.0.1:" + PORT);
  console.log("[subscriber-manager] POST /start to start MQTT subscriber");
});
