"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";

/**
 * 구독 신청: MQTT 구독 스크립트를 시작 요청.
 * subscriber-manager가 실행 중이면 스크립트가 떠서 아두이노 데이터가 DB에 반영됨.
 */
export function SensorIngestButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const startSubscriber = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscriber/start", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        started?: boolean;
        message?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(
          res.status === 503 && typeof data.message === "string"
            ? data.message
            : data.error ?? res.statusText
        );
        return;
      }
      setStatus("ok");
      setMessage(
        data.started === false
          ? "구독 스크립트가 이미 실행 중입니다."
          : "구독 스크립트를 시작했습니다. 아두이노 데이터가 10초마다 반영됩니다."
      );
    } catch (e) {
      setStatus("error");
      setMessage(
        "구독 스크립트 시작 실패. 로컬에서는 npm run dev 로 실행한 뒤 다시 시도하세요."
      );
    } finally {
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={status === "loading"}
        onClick={startSubscriber}
        className="gap-1.5"
      >
        <Radio className="size-3.5" aria-hidden />
        {status === "loading" ? "시작 중…" : "구독 신청"}
      </Button>
      {status === "ok" && (
        <Badge variant="secondary" className="font-normal text-green-700 dark:text-green-400">
          {message}
        </Badge>
      )}
      {status === "error" && (
        <Badge variant="destructive" className="font-normal">
          {message}
        </Badge>
      )}
    </div>
  );
}
