import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosClient from "../api/axiosClient";

const METRIC_OPTIONS = [
  { value: "WEIGHT", label: "Weight", unit: "kg" },
  { value: "HEART_RATE", label: "Heart Rate", unit: "bpm" },
  { value: "SLEEP_HOURS", label: "Sleep", unit: "hours" },
  { value: "SYSTOLIC_BP", label: "Blood Pressure", unit: "mmHg" },
  { value: "BLOOD_SUGAR", label: "Blood Sugar", unit: "mg/dL" },
];

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function toDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function HealthPage() {
  const [selectedMetric, setSelectedMetric] = useState("WEIGHT");
  const [rangeDays, setRangeDays] = useState(7);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      metricType: "WEIGHT",
      value: "",
      unit: "kg",
      recordedAt: toDateTimeLocal(new Date()),
      notes: "",
    },
  });

  const watchedType = watch("metricType");

  useEffect(() => {
    const selected = METRIC_OPTIONS.find((option) => option.value === watchedType);
    if (selected) {
      setValue("unit", selected.unit);
    }
  }, [setValue, watchedType]);

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (rangeDays - 1));
    return {
      startDate: toDateString(start),
      endDate: toDateString(end),
    };
  }, [rangeDays]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await axiosClient.get("/health/metrics", {
          params: {
            type: selectedMetric,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        });
        setMetrics(response.data ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load health data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange.endDate, dateRange.startDate, selectedMetric]);

  const chartData = useMemo(
    () =>
      [...metrics]
        .reverse()
        .map((item) => ({
          recordedAt: new Date(item.recordedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: Number(item.value ?? 0),
          unit: item.unit,
        })),
    [metrics]
  );

  const onSubmit = async (values) => {
    setError("");
    try {
      await axiosClient.post("/health/metric", {
        metricType: values.metricType,
        value: Number(values.value),
        unit: values.unit,
        recordedAt: values.recordedAt,
        notes: values.notes,
      });

      if (values.metricType === selectedMetric) {
        const response = await axiosClient.get("/health/metrics", {
          params: {
            type: selectedMetric,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        });
        setMetrics(response.data ?? []);
      }

      reset({
        metricType: values.metricType,
        value: "",
        unit: values.unit,
        recordedAt: toDateTimeLocal(new Date()),
        notes: "",
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log metric");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your wellness metrics and monitor trends over time.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Metric</span>
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Date range</span>
            <select
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              className="w-full rounded border px-3 py-2"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recordedAt" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {isLoading ? (
          <p className="mt-2 text-sm text-slate-500">Loading chart...</p>
        ) : null}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Log New Metric</h2>
        <form
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Metric type</span>
            <select
              {...register("metricType", { required: true })}
              className="w-full rounded border px-3 py-2"
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="DIASTOLIC_BP">Diastolic BP</option>
              <option value="BMI">BMI</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Value</span>
            <input
              {...register("value", { required: true })}
              type="number"
              step="0.01"
              className="w-full rounded border px-3 py-2"
              placeholder="Enter value"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Unit</span>
            <input
              {...register("unit", { required: true })}
              type="text"
              className="w-full rounded border px-3 py-2"
              placeholder="e.g. kg, bpm, mg/dL"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Recorded at</span>
            <input
              {...register("recordedAt", { required: true })}
              type="datetime-local"
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Notes</span>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full rounded border px-3 py-2"
              placeholder="Optional notes"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save reading"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
