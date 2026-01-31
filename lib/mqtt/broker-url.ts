/**
 * MQTT 브로커 URL 처리
 * .env.local: wss://cluster.s1.eu.hivemq.cloud:8884/mqtt (HiveMQ WebSocket)
 */

export function getBrokerUrl(): string {
  const url = process.env.MQTT_BROKER_URL;
  if (!url || typeof url !== "string" || !url.trim()) {
    throw new Error("MQTT_BROKER_URL is not set");
  }
  const trimmed = url.trim();
  // wss://, ws:// 이미 올바른 형식
  if (trimmed.startsWith("wss://") || trimmed.startsWith("ws://")) {
    return trimmed;
  }
  // ssl://, mqtts:// + 8884 → wss:// (WebSocket)
  if (trimmed.includes(":8884")) {
    return trimmed
      .replace(/^ssl:\/\//i, "wss://")
      .replace(/^mqtts:\/\//i, "wss://");
  }
  // ssl:// + 8883 → mqtts:// (TCP TLS)
  if (trimmed.startsWith("ssl://")) {
    return trimmed.replace(/^ssl:\/\//i, "mqtts://");
  }
  return trimmed;
}
