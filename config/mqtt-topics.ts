/**
 * MQTT 토픽 상수
 * 3단계 아두이노 펌웨어·4단계 웹/백엔드와 동일 규칙
 */

export const MQTT_TOPICS = {
  SENSOR_READINGS: "smartfarm/sensor/readings",
  ACTUATOR_COMMAND: "smartfarm/actuator/command",
} as const;
