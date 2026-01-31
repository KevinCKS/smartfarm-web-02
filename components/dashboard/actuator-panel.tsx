"use client";

import { useCallback, useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import type { ActuatorCode } from "@/types/mqtt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lightbulb, Droplets, Fan } from "lucide-react";

type Actuator = Tables<"actuators">;

const CODE_CONFIG: Record<
  ActuatorCode,
  { label: string; Icon: typeof Lightbulb }
> = {
  led: { label: "식물성장 LED", Icon: Lightbulb },
  pump: { label: "양액 펌프", Icon: Droplets },
  fan1: { label: "팬 1", Icon: Fan },
  fan2: { label: "팬 2", Icon: Fan },
};

export function ActuatorPanel() {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ActuatorCode | null>(null);

  const fetchActuators = useCallback(async () => {
    try {
      const res = await fetch("/api/actuator");
      if (!res.ok) throw new Error(await res.text());
      const data: Actuator[] = await res.json();
      setActuators(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "액추에이터 상태 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActuators();
  }, [fetchActuators]);

  const toggle = async (code: ActuatorCode, currentOn: boolean) => {
    const nextOn = !currentOn;
    setPending(code);
    try {
      const res = await fetch("/api/actuator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, is_on: nextOn }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? res.statusText);
      }
      await fetchActuators();
    } catch (e) {
      setError(e instanceof Error ? e.message : "제어 실패");
    } finally {
      setPending(null);
    }
  };

  if (loading && actuators.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12 text-muted-foreground">
        액추에이터 상태 로딩 중…
      </div>
    );
  }

  if (error && actuators.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  const byCode = new Map(actuators.map((a) => [a.code, a]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(["led", "pump", "fan1", "fan2"] as const).map((code) => {
        const row = byCode.get(code);
        const { label, Icon } = CODE_CONFIG[code];
        const displayName = row?.display_name ?? label;
        const isOn = row?.is_on ?? false;
        const busy = pending === code;
        return (
          <Card
            key={code}
            className={cn(
              "overflow-hidden border-border/80 bg-card/95 transition-all backdrop-blur-sm",
              isOn && "border-section-actuator-accent/50 bg-section-actuator-accent/10 shadow-md"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isOn ? "bg-section-actuator-accent/20 text-section-actuator-accent" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <Badge
                  variant={isOn ? "default" : "secondary"}
                  className={cn("shrink-0 font-normal", isOn && "bg-section-actuator-accent text-white hover:bg-section-actuator-accent/90")}
                >
                  {isOn ? "ON" : "OFF"}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {displayName}
              </p>
              <Button
                variant={isOn ? "default" : "outline"}
                size="sm"
                className={cn("mt-4 w-full", isOn && "bg-section-actuator-accent hover:bg-section-actuator-accent/90")}
                disabled={busy}
                onClick={() => toggle(code, isOn)}
              >
                {busy ? "전송 중…" : isOn ? "끄기" : "켜기"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
