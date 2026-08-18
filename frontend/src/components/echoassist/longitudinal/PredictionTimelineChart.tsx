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
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Examination } from "@/lib/echoassist/types";
import { formatDateTime } from "@/lib/echoassist/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export interface PredictionTimelineChartProps {
  examinations: Examination[];
}

export function PredictionTimelineChart({ examinations }: PredictionTimelineChartProps) {
  // Sort chronologically (oldest to newest)
  const sorted = useMemo(() => {
    return [...examinations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [examinations]);

  // Extract distinct diagnosis labels dynamically
  const { diagnosisCategories, diagnosisToValue } = useMemo(() => {
    const standardCategories = ["Normal", "Mild Murmur", "Moderate Murmur", "Severe Murmur"];
    const uniqueFromData = Array.from(new Set(sorted.map((e) => e.diagnosis.trim()))).filter(
      Boolean,
    );

    const isStandardSubset =
      uniqueFromData.length > 0 &&
      uniqueFromData.every((diag) =>
        standardCategories.some((sc) => sc.toLowerCase() === diag.toLowerCase()),
      );

    if (isStandardSubset) {
      const map: Record<string, number> = {};
      standardCategories.forEach((cat, idx) => {
        map[cat.toLowerCase()] = idx;
      });
      return {
        diagnosisCategories: standardCategories,
        diagnosisToValue: (d: string) => map[d.trim().toLowerCase()] ?? 0,
      };
    }

    // Dynamic mapping preserving original labels
    // Sort so normal-sounding diagnoses appear at bottom (0) and abnormalities higher up
    const categories = [...uniqueFromData].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower.includes("normal") && !aLower.includes("abnormal")) return -1;
      if (bLower.includes("normal") && !bLower.includes("abnormal")) return 1;
      return a.localeCompare(b);
    });

    const map: Record<string, number> = {};
    categories.forEach((cat, idx) => {
      map[cat] = idx;
    });

    return {
      diagnosisCategories: categories,
      diagnosisToValue: (d: string) => map[d.trim()] ?? 0,
    };
  }, [sorted]);

  const labels = useMemo(() => {
    return sorted.map((e) => {
      const d = new Date(e.timestamp);
      return isNaN(d.getTime())
        ? e.timestamp
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
  }, [sorted]);

  const dataPoints = useMemo(() => {
    return sorted.map((e) => diagnosisToValue(e.diagnosis));
  }, [sorted, diagnosisToValue]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Diagnosis Timeline",
        data: dataPoints,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        pointBackgroundColor: sorted.map((e) => {
          const lower = e.diagnosis.toLowerCase();
          if (lower.includes("normal") && !lower.includes("abnormal")) return "#16a34a";
          if (
            lower.includes("murmur") ||
            lower.includes("abnormal") ||
            lower.includes("regurgitation") ||
            lower.includes("stenosis")
          )
            return "#ef4444";
          return "#8b5cf6";
        }),
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        stepped: "before" as const,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
            return [
              `Diagnosis: ${exam?.diagnosis ?? "N/A"}`,
              `Confidence: ${exam ? Math.round(exam.confidence <= 1 ? exam.confidence * 100 : exam.confidence) : 0}%`,
              `Signal Quality: ${exam?.signal_quality ?? "N/A"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(100, 116, 139, 0.1)" },
        ticks: { font: { size: 11 }, color: "#64748b" },
      },
      y: {
        min: -0.2,
        max: Math.max(1, diagnosisCategories.length - 0.8),
        grid: { color: "rgba(100, 116, 139, 0.1)" },
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          color: "#64748b",
          callback: (value) => {
            const idx = typeof value === "number" ? Math.round(value) : parseInt(String(value), 10);
            return diagnosisCategories[idx] ?? "";
          },
        },
      },
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border p-6 text-xs text-muted-foreground">
        No examination records available for prediction timeline.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Prediction & Diagnosis Progression
          </h3>
          <p className="text-xs text-muted-foreground">
            Categorical timeline of backend AI diagnostic predictions across examinations.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {diagnosisCategories.length}{" "}
          {diagnosisCategories.length === 1 ? "category" : "categories"}
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
