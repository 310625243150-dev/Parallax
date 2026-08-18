import { useMemo } from "react";
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
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Examination } from "@/lib/echoassist/types";
import { safeConfidencePercent } from "@/lib/echoassist/longitudinal";
import { formatDateTime } from "@/lib/echoassist/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export interface ConfidenceChartProps {
  examinations: Examination[];
}

export function ConfidenceChart({ examinations }: ConfidenceChartProps) {
  // Sort chronologically (oldest to newest for X-axis progression)
  const sorted = useMemo(() => {
    return [...examinations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [examinations]);

  const labels = useMemo(() => {
    return sorted.map((e) => {
      const d = new Date(e.timestamp);
      return isNaN(d.getTime())
        ? e.timestamp
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  }, [sorted]);

  const dataPoints = useMemo(() => {
    return sorted.map((e) => safeConfidencePercent(e.confidence));
  }, [sorted]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "AI Confidence (%)",
        data: dataPoints,
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.12)",
        pointBackgroundColor: "#0284c7",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const exam = sorted[idx];
            return exam ? formatDateTime(exam.timestamp) : "";
          },
          label: (item) => {
            const idx = item.dataIndex;
            const exam = sorted[idx];
            const val = item.raw;
            return [
              `Confidence: ${val}%`,
              `Diagnosis: ${exam?.diagnosis ?? "N/A"}`,
              `Signal Quality: ${exam?.signal_quality ?? "N/A"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(100, 116, 139, 0.1)",
        },
        ticks: {
          font: { size: 11 },
          color: "#64748b",
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(100, 116, 139, 0.1)",
        },
        ticks: {
          font: { size: 11 },
          color: "#64748b",
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border p-6 text-xs text-muted-foreground">
        No examination records available for confidence trend.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            AI Model Confidence Over Time
          </h3>
          <p className="text-xs text-muted-foreground">
            Diagnostic model prediction confidence per examination (0% – 100%).
          </p>
        </div>
        <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
          {sorted.length} {sorted.length === 1 ? "point" : "points"}
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
