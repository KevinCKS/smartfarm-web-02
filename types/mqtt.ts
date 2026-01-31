/**
 * MQTT payload 타입
 * smartfarm/sensor/readings, smartfarm/actuator/command
 */

export interface SensorReadingsPayload {
  temperature: number;
  humidity: number;
  ec: number;
  ph: number;
}

export type ActuatorCode = "led" | "pump" | "fan1" | "fan2";

export interface ActuatorCommandPayload {
  code: ActuatorCode;
  is_on: boolean;
}
