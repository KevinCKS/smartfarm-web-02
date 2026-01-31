/*
 * Smartfarm R4 — 아두이노 우노 R4 WiFi 펌웨어
 * PRD F1: 센서 값 주기적 수집·MQTT publish
 * PRD F5: 제어 토픽 구독·액추에이터 동작
 *
 * 센서: temperature, humidity (DHT11 pin 7), ec, ph
 * 액추에이터: led, pump, fan1, fan2 (DB actuators.code와 동일)
 */

#include "arduino_secrets.h"
#include "WiFiS3.h"
#include "WiFiSSLClient.h"
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ----- MQTT (arduino_secrets.h 에서 호스트/계정, 포트 8883) -----
#define MQTT_BROKER_PORT 8883
#define MQTT_CLIENT_ID "smartfarm-arduino"

// ----- 토픽 (4단계 MQTT 연동과 동일 규칙) -----
#define TOPIC_SENSOR_PUB   "smartfarm/sensor/readings"
#define TOPIC_ACTUATOR_SUB "smartfarm/actuator/command"

// ----- 센서 핀 (docs/3-arduino-firmware.md 참고) -----
#define PIN_DHT11  7
#define PIN_EC     A2
#define PIN_PH     A3

#define DHT_TYPE DHT11
DHT dht(PIN_DHT11, DHT_TYPE);

// ----- 액추에이터 핀 (릴레이/모스펫 제어) -----
#define PIN_LED    2
#define PIN_PUMP   3
#define PIN_FAN1   4
#define PIN_FAN2   5

// ----- 주기 -----
#define SENSOR_INTERVAL_MS 10000   // 10초마다 센서 publish
#define MQTT_KEEPALIVE     60

WiFiSSLClient wifiClient;
PubSubClient mqtt(wifiClient);

unsigned long lastSensorPublish = 0;
bool ledOn = false, pumpOn = false, fan1On = false, fan2On = false;

void setup() {
  Serial.begin(115200);

  dht.begin();

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_FAN1, OUTPUT);
  pinMode(PIN_FAN2, OUTPUT);
  setActuators(false, false, false, false);

  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("WiFi module not found");
    while (true) {}
  }
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // HiveMQ Cloud TLS (8883), R4 WiFi 내장 CA 번들 사용
  mqtt.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqtt.setBufferSize(256);
  mqtt.setKeepAlive(MQTT_KEEPALIVE);
  mqtt.setCallback(onMqttMessage);

  connectMqtt();
  lastSensorPublish = millis();
}

void loop() {
  if (!mqtt.connected())
    connectMqtt();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    lastSensorPublish = now;
    publishSensorReadings();
  }
}

void connectMqtt() {
  while (!mqtt.connected()) {
    Serial.print("MQTT connecting... ");
    if (mqtt.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("connected");
      mqtt.subscribe(TOPIC_ACTUATOR_SUB);
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqtt.state());
      delay(3000);
    }
  }
}

void publishSensorReadings() {
  float temperature = readTemperature();
  float humidity   = readHumidity();
  float ec         = readEc();
  float ph         = readPh();

  Serial.print("[Sensor] temp=");
  Serial.print(temperature);
  Serial.print(" hum=");
  Serial.print(humidity);
  Serial.print(" ec=");
  Serial.print(ec);
  Serial.print(" ph=");
  Serial.println(ph);

  StaticJsonDocument<128> doc;
  doc["temperature"] = round(temperature * 100) / 100.0;
  doc["humidity"]    = round(humidity * 100) / 100.0;
  doc["ec"]          = round(ec * 100) / 100.0;
  doc["ph"]          = round(ph * 100) / 100.0;

  char payload[128];
  size_t len = serializeJson(doc, payload);
  if (mqtt.publish(TOPIC_SENSOR_PUB, (const uint8_t*)payload, (unsigned int)len, false))
    Serial.println("Published sensor readings");
  else
    Serial.println("Publish failed");
}

float readTemperature() {
  float t = dht.readTemperature();
  return isnan(t) ? 0.0f : t;
}

float readHumidity() {
  float h = dht.readHumidity();
  return isnan(h) ? 0.0f : h;
}

float readEc() {
  // TODO: 실제 EC 센서로 교체
  int raw = analogRead(PIN_EC);
  return map(raw, 0, 1023, 0, 300) / 100.0f;  // 0~3.0 mS/cm 가정
}

float readPh() {
  // TODO: 실제 pH 센서로 교체
  int raw = analogRead(PIN_PH);
  return map(raw, 0, 1023, 0, 140) / 10.0f;   // 0~14.0 가정
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT RX] topic=");
  Serial.print(topic);
  Serial.print(" payload=");
  for (unsigned int i = 0; i < length && i < 64; i++)
    Serial.print((char)payload[i]);
  Serial.println();

  if (length == 0) return;

  StaticJsonDocument<64> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.print("JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* code = doc["code"];
  bool isOn = doc["is_on"] | false;
  if (!code) return;

  if (strcmp(code, "led") == 0)   { ledOn = isOn;   digitalWrite(PIN_LED, ledOn ? HIGH : LOW);   }
  if (strcmp(code, "pump") == 0)  { pumpOn = isOn; digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW); }
  if (strcmp(code, "fan1") == 0)  { fan1On = isOn; digitalWrite(PIN_FAN1, fan1On ? HIGH : LOW); }
  if (strcmp(code, "fan2") == 0)  { fan2On = isOn; digitalWrite(PIN_FAN2, fan2On ? HIGH : LOW); }
}

void setActuators(bool led, bool pump, bool fan1, bool fan2) {
  ledOn = led;   pumpOn = pump;   fan1On = fan1;   fan2On = fan2;
  digitalWrite(PIN_LED,  ledOn ? HIGH : LOW);
  digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
  digitalWrite(PIN_FAN1, fan1On ? HIGH : LOW);
  digitalWrite(PIN_FAN2, fan2On ? HIGH : LOW);
}
