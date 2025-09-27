"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin,
  annotationPlugin
);

type SensorChartProps = {
  title: string;
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
  maxY: number;
  threshold?: { value: number; color: string; label: string; unit?: string };
};

export default function SensorChart({
  title,
  labels,
  datasets,
  maxY,
  threshold,
}: SensorChartProps) {
  const chartData = {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color + "33",
      fill: true,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 0,
    })),
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: false },
    animation: { duration: 400, easing: "easeOutQuart" },
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: { enabled: true },
      zoom: {
        zoom: {
          wheel: { enabled: true }, // ซูมด้วย scroll
          pinch: { enabled: true }, // pinch บนมือถือ
          mode: "x" as const, // ซูมเฉพาะแกน X
        },
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        limits: {
          x: { min: "original", max: "original" },
          y: { min: 0, max: maxY },
        },
      },
      annotation: threshold
        ? {
            annotations: {
              limit: {
                type: "line",
                yMin: threshold.value,
                yMax: threshold.value,
                borderColor: threshold.color,
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: threshold.label,
                  color: threshold.color,
                  backgroundColor: "rgba(255,255,255,0.85)",
                  position: "start",
                },
              },
            },
          }
        : {},
    },
    scales: {
      x: { ticks: { color: "#6b7280", font: { size: 10 } } },
      y: { min: 0, max: maxY, ticks: { color: "#6b7280" } },
    },
  };

  // ✅ ปุ่ม Reset Zoom
  const resetZoom = () => {
    const chart = ChartJS.getChart(title); // ใช้ title เป็น id
    chart?.resetZoom();
  };

  return (
    <div className="p-4 rounded-lg border bg-white shadow min-h-[320px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <button
          onClick={resetZoom}
          className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          🔄 Reset Zoom
        </button>
      </div>
      <div className="flex-1">
        <Line id={title} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
