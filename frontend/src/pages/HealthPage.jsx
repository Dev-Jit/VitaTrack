import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

/** Display-only chart target for weight (kg), shown as legend + reference line */
const WEIGHT_CHART_TARGET_KG = 75;

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

  const selectedMetricLabel =
    METRIC_OPTIONS.find((o) => o.value === selectedMetric)?.label ?? "Metric";

  const lastThreeReadings = useMemo(() => {
    const sorted = [...metrics].sort(
      (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
    );
    return sorted.slice(0, 3);
  }, [metrics]);

  const unitIsAutoFilled = METRIC_OPTIONS.some((o) => o.value === watchedType);

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

  const fieldClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition-[box-shadow,border-color] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20";

  const unitFieldClass = unitIsAutoFilled
    ? `${fieldClass} cursor-not-allowed bg-emerald-50/80 text-emerald-900`
    : fieldClass;

  const yAxisDomain = selectedMetric === "WEIGHT" ? [60, 80] : undefined;

  return (
    <div className="-mx-4 -mt-4 bg-green-50 px-6 py-8 pb-24 md:-mx-6 md:-mt-6 md:px-8 md:pb-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
              Health Monitoring
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Track your wellness metrics and monitor trends over time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
            <Link
              to="/nutrition"
              className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-950"
            >
              Add food
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <Link
              to="/profile"
              aria-label="Settings"
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-sm font-semibold text-emerald-900 shadow-sm"
              aria-hidden
            >
              VT
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-700">Metric</span>
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
              className={fieldClass}
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-700">
              Date range
            </span>
            <select
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              className={fieldClass}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedMetricLabel} Trend
              </h2>
            </div>
            {selectedMetric === "WEIGHT" ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                <span>
                  Target: {WEIGHT_CHART_TARGET_KG}
                  kg
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 md:p-5">
            <div className="h-80 w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="recordedAt"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis
                    {...(yAxisDomain ? { domain: yAxisDomain } : {})}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    tickFormatter={(v) =>
                      selectedMetric === "WEIGHT" ? `${v}kg` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                    }}
                  />
                  {selectedMetric === "WEIGHT" ? (
                    <ReferenceLine
                      y={WEIGHT_CHART_TARGET_KG}
                      stroke="#10b981"
                      strokeDasharray="6 4"
                      strokeOpacity={0.85}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#16a34a", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-3 text-sm text-gray-500">Loading chart...</p>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6 lg:col-span-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Log New Metric
            </h2>
            <form
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Metric type
                </span>
                <select
                  {...register("metricType", { required: true })}
                  className={fieldClass}
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
                <span className="mb-1.5 block font-medium text-gray-700">
                  Value
                </span>
                <input
                  {...register("value", { required: true })}
                  type="number"
                  step="0.01"
                  className={fieldClass}
                  placeholder="Enter value"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Unit
                </span>
                <input
                  {...register("unit", { required: true })}
                  type="text"
                  readOnly={unitIsAutoFilled}
                  className={unitFieldClass}
                  placeholder="e.g. kg, bpm, mg/dL"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Recorded at
                </span>
                <input
                  {...register("recordedAt", { required: true })}
                  type="datetime-local"
                  className={fieldClass}
                />
              </label>

              <label className="text-sm md:col-span-2">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Notes
                </span>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className={fieldClass}
                  placeholder="Optional notes"
                />
              </label>

              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-950 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save reading"}
                </button>
              </div>
            </form>
          </section>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <aside className="rounded-xl border border-emerald-200/80 bg-emerald-100/70 p-5 shadow-sm">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/80">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-900/90">
                    Health tip
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-950/90">
                    Consistently tracking your weight at the same time every
                    day—ideally right after waking up—provides the most accurate
                    trend data for clinical review.
                  </p>
                </div>
              </div>
            </aside>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last 3 readings
              </h3>
              {lastThreeReadings.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No readings yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {lastThreeReadings.map((row) => (
                    <li
                      key={row.id ?? `${row.recordedAt}-${row.value}`}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0"
                    >
                      <span className="text-sm text-gray-600">
                        {new Date(row.recordedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <span className="text-sm font-bold text-emerald-900">
                        {Number(row.value ?? 0)}{" "}
                        {row.unit ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
