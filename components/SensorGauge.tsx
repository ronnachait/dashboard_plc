// components/SensorGauge.tsx
"use client";

import { Droplet, Thermometer } from "lucide-react";

type SensorGaugeProps = {
  label: string; // เช่น P1, T1
  value: number;
  unit: string; // bar, °C
  maxValue: number;
};

export default function SensorGauge({
  label,
  value,
  unit,
  maxValue,
}: SensorGaugeProps) {
  const percent = Math.min((value / maxValue) * 100, 100);

  const level =
    value > maxValue ? "alarm" : value > maxValue * 0.8 ? "warn" : "normal";

  const color =
    level === "alarm"
      ? {
          text: "text-red-600",
          stroke: "stroke-red-500",
          bg: "from-red-50 to-red-100",
        }
      : level === "warn"
      ? {
          text: "text-yellow-600",
          stroke: "stroke-yellow-400",
          bg: "from-yellow-50 to-yellow-100",
        }
      : {
          text: "text-green-600",
          stroke: "stroke-green-500",
          bg: "from-green-50 to-green-100",
        };

  const isPressure = label.startsWith("P");

  return (
    <div
      className={`p-3 rounded-lg shadow-sm border bg-gradient-to-br ${color.bg} flex flex-col items-center hover:shadow-md transition`}
    >
      {/* Header */}
      <div className="flex items-center gap-1 mb-1">
        {isPressure ? (
          <Droplet className={`w-3.5 h-3.5 ${color.text}`} />
        ) : (
          <Thermometer className={`w-3.5 h-3.5 ${color.text}`} />
        )}
        <h4 className={`text-xs font-semibold ${color.text}`}>{label}</h4>
      </div>

      {/* Gauge Ring */}
      <div className="relative flex items-center justify-center my-1">
        <svg className="w-14 h-14 -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            className="stroke-gray-200"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            className={`${color.stroke} transition-all duration-700`}
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 24}
            strokeDashoffset={
              2 * Math.PI * 24 - (percent / 100) * (2 * Math.PI * 24)
            }
          />
        </svg>
        <p className={`absolute text-sm font-bold ${color.text}`}>
          {typeof value === "number" ? value.toFixed(1) : "N/A"}
        </p>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-gray-600">
        {typeof percent === "number" ? percent.toFixed(0) : "N/A"}% of{" "}
        {maxValue} {unit}
      </p>
    </div>
  );
}
