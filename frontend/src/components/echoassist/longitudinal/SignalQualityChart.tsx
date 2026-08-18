import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Examination } from "@/lib/echoassist/types";
import { mapSignalQuality } from "@/lib/echoassist/longitudinal";
import { formatDateTime } from "@/lib/echoassist/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export interface SignalQualityChartProps {
  examinations: Examination[];
}

export function SignalQualityChart({ examinations }: SignalQualityChartProps) {
  // Sort chronologically (oldest to newest)
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

  const mappedData = useMemo(() => {
    return sorted.map((e) => mapSignalQuality(e.signal_quality));
  }, [sorted]);

  const scores = useMemo(() => mappedData.map((m) => m.score), [mappedData]);
  const barColors = useMemo(() => mappedData.map((m) => m.color), [mappedData]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Signal Quality Score",
        data: scores,
        backgroundColor: barColors,
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
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
            const q = mappedData[idx];
            return [
              `Signal Quality: ${exam?.signal_quality ?? "N/A"}`,
              `Visualization Score: ${q?.score ?? item.raw} / 100`,
              `Audio Ref: ${exam?.audio_reference ?? "N/A"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#64748b" },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(100, 116, 139, 0.1)" },
        ticks: {
          stepSize: 25,
          font: { size: 11 },
          color: "#64748b",
          callback: (val) => {
            if (val === 100) return "Good (100)";
            if (val === 60) return "Acceptable (60)";
            if (val === 25) return "Poor (25)";
            if (val === 0) return "0";
            return "";
          },
        },
      },
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border p-6 text-xs text-muted-foreground">
        No examination records available for signal quality trend.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Auscultation Signal Quality Trend
          </h3>
          <p className="text-xs text-muted-foreground">
            Standardized visualization score: Good (100), Acceptable (60), Poor (25).
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Good
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Acceptable
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Poor
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <Bar data={chartData} options={options} />
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground italic text-center">
        * Note: Quality scores are visual indicators derived from categorical ratings and are not
        clinical raw audio measurements.
      </p>
    </div>
  );
}
