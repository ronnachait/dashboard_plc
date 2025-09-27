// hooks/useChartOptions.ts
import { ChartOptions } from "chart.js";

export function useChartOptions(
  yMax: number,
  threshold?: { value: number; color?: string; label?: string }
) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 12, weight: "bold" as const },
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 13, weight: "bold" as const },
        bodyFont: { size: 12 },
        cornerRadius: 6,
      },
      annotation: threshold
        ? {
            annotations: {
              maxLine: {
                type: "line",
                yMin: threshold.value,
                yMax: threshold.value,
                borderColor: threshold.color || "#dc2626", // 🔴 สีแดงสด
                borderWidth: 3, // 🔥 เส้นหนาชัด
                borderDash: [8, 4], // จุดประชัดเจน
                label: {
                  enabled: true,
                  content: threshold.label || "MAX",
                  position: "end",
                  backgroundColor: threshold.color || "#dc2626",
                  color: "#ffffff",
                  font: { size: 12, weight: "bold" as const },
                  padding: 6,
                  borderRadius: 4,
                },
              },
            },
          }
        : {},
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { maxRotation: 45, color: "#374151", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        max: yMax,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { color: "#374151", font: { size: 11 } },
      },
    },
  };

  return options;
}
