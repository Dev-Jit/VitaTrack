import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosClient from "../api/axiosClient";

const TABS = ["Daily", "Weekly", "Monthly"];
const DEFAULT_CALORIE_GOAL = 2000;

function yyyyMmDd(date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function monthDefault() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function toMetricLabel(metricType) {
  return (
    {
      WEIGHT: "Weight",
      BMI: "BMI",
      SLEEP_HOURS: "Sleep",
      HEART_RATE: "Heart rate",
      SYSTOLIC_BP: "Systolic BP",
      DIASTOLIC_BP: "Diastolic BP",
      BLOOD_SUGAR: "Blood sugar",
      BLOOD_OXYGEN: "Blood oxygen",
    }[metricType] ?? metricType
  );
}

/** Decorative slider position (0–1) for metric rows */
function metricVisualPosition(metricType, value) {
  const v = Number(value ?? 0);
  switch (metricType) {
    case "SYSTOLIC_BP":
      return clamp01((v - 80) / 80);
    case "DIASTOLIC_BP":
      return clamp01((v - 40) / 80);
    case "HEART_RATE":
      return clamp01((v - 40) / 120);
    case "BLOOD_SUGAR":
      return clamp01((v - 70) / 200);
    default:
      return 0.5;
  }
}

function formatReportDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

function BreakdownCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("Daily");
  const [error, setError] = useState("");

  const [dailyDate, setDailyDate] = useState(yyyyMmDd(new Date()));
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [weeklyStart, setWeeklyStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return yyyyMmDd(d);
  });
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyBars, setWeeklyBars] = useState([]);

  const [{ month, year }, setMonthYear] = useState(monthDefault);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    if (tab !== "Daily") return;
    const run = async () => {
      setDailyLoading(true);
      setError("");
      try {
        const res = await axiosClient.get("/reports/daily", {
          params: { date: dailyDate },
        });
        setDaily(res.data);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load daily report");
      } finally {
        setDailyLoading(false);
      }
    };
    run();
  }, [dailyDate, tab]);

  useEffect(() => {
    if (tab !== "Weekly") return;
    const run = async () => {
      setWeeklyLoading(true);
      setError("");
      try {
        const start = new Date(weeklyStart);
        const dates = [...Array(7)].map((_, idx) => {
          const d = new Date(start);
          d.setDate(d.getDate() + idx);
          return d;
        });
        const responses = await Promise.all(
          dates.map((d) =>
            axiosClient.get("/reports/daily", { params: { date: yyyyMmDd(d) } })
          )
        );
        setWeeklyBars(
          responses.map((r, idx) => ({
            day: shortDay(dates[idx]),
            consumed: Number(r.data?.caloriesConsumed ?? 0),
            burned: Number(r.data?.caloriesBurned ?? 0),
          }))
        );
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load weekly report");
      } finally {
        setWeeklyLoading(false);
      }
    };
    run();
  }, [tab, weeklyStart]);

  useEffect(() => {
    if (tab !== "Monthly") return;
    const run = async () => {
      setMonthlyLoading(true);
      setError("");
      try {
        const res = await axiosClient.get("/reports/monthly", {
          params: { month, year },
        });
        setMonthly(res.data);
      } catch (err) {
        setError(
          err?.response?.data?.message ?? "Failed to load monthly report"
        );
      } finally {
        setMonthlyLoading(false);
      }
    };
    run();
  }, [month, tab, year]);

  const monthlyWeightData = useMemo(() => {
    const trends = monthly?.trends ?? [];
    return trends
      .filter((t) => t.weightKg != null)
      .map((t) => ({
        day: String(new Date(t.date).getDate()),
        weightKg: Number(t.weightKg),
      }));
  }, [monthly]);

  const monthlySleepData = useMemo(() => {
    const trends = monthly?.trends ?? [];
    return trends
      .filter((t) => t.sleepHoursAvg != null)
      .map((t) => ({
        day: String(new Date(t.date).getDate()),
        sleepHoursAvg: Number(t.sleepHoursAvg),
      }));
  }, [monthly]);

  const caloriesConsumed = Number(daily?.caloriesConsumed ?? 0);
  const caloriePct = clamp01(caloriesConsumed / DEFAULT_CALORIE_GOAL);

  const protein = Number(daily?.protein ?? 0);
  const carbs = Number(daily?.carbs ?? 0);
  const fat = Number(daily?.fat ?? 0);
  const macroTotal = protein + carbs + fat || 1;
  const macroWidths = {
    p: (protein / macroTotal) * 100,
    c: (carbs / macroTotal) * 100,
    f: (fat / macroTotal) * 100,
  };

  const waterMl = Number(daily?.waterIntakeMl ?? 0);
  const waterHint =
    waterMl >= 2500
      ? "Optimal hydration"
      : waterMl >= 1500
        ? "On track for your goal"
        : "Keep sipping through the day";

  return (
    <div className="-mx-4 -mt-4 bg-green-50 px-6 py-8 pb-24 md:-mx-6 md:-mt-6 md:px-8 md:pb-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Daily, weekly, and monthly insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
            {tab === "Daily" ? (
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25m-18 0v7.5"
                  />
                </svg>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="border-0 bg-transparent p-0 text-sm font-medium text-gray-900 outline-none"
                />
                <span className="hidden text-xs text-gray-400 sm:inline">
                  {formatReportDate(dailyDate)}
                </span>
              </label>
            ) : null}
            {tab === "Weekly" ? (
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25m-18 0v7.5"
                  />
                </svg>
                <input
                  type="date"
                  value={weeklyStart}
                  onChange={(e) => setWeeklyStart(e.target.value)}
                  className="border-0 bg-transparent p-0 text-sm font-medium text-gray-900 outline-none"
                />
              </label>
            ) : null}
            {tab === "Monthly" ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Month
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(e) =>
                      setMonthYear((prev) => ({
                        ...prev,
                        month: Number(e.target.value),
                      }))
                    }
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-900"
                  />
                </label>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Year
                  <input
                    type="number"
                    value={year}
                    onChange={(e) =>
                      setMonthYear((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-900"
                  />
                </label>
              </div>
            ) : null}
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:bg-white/90"
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
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:bg-white/90"
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
            <Link
              to="/nutrition"
              className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-950"
            >
              Add food
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                tab === t
                  ? "bg-gray-900 text-white shadow-sm"
                  : "border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200/80",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {tab === "Daily" ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Daily breakdown
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Calories, macros, water, exercise, and health metrics
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <BreakdownCard>
                <p className="text-sm font-medium text-gray-500">
                  Calories consumed
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                  {dailyLoading
                    ? "…"
                    : `${Math.round(caloriesConsumed)} kcal`}
                </p>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${caloriePct * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Goal {DEFAULT_CALORIE_GOAL} kcal
                </p>
              </BreakdownCard>

              <BreakdownCard>
                <p className="text-sm font-medium text-gray-500">Water</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                  {dailyLoading ? "…" : `${waterMl} ml`}
                </p>
                <div className="mt-4 flex items-center gap-2 text-emerald-700">
                  <svg
                    className="h-6 w-6 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12 2.25c.53 0 1.04.21 1.41.59l.09.09c.85.85 2.24 2.56 3.31 4.69 1.02 2.03 1.45 4.13.81 5.77-.48 1.2-1.45 2.08-2.87 2.44V20a2.25 2.25 0 01-4.5 0v-4.17c-1.42-.36-2.39-1.24-2.87-2.44-.64-1.64-.21-3.74.81-5.77 1.07-2.13 2.46-3.84 3.31-4.69l.09-.09A2 2 0 0112 2.25z" />
                  </svg>
                  <span className="text-sm font-medium">{waterHint}</span>
                </div>
              </BreakdownCard>

              <BreakdownCard>
                <p className="text-sm font-medium text-gray-500">Exercise</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                  {dailyLoading ? "…" : `${daily?.exerciseMinutes ?? 0} min`}
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  {dailyLoading
                    ? ""
                    : `${daily?.caloriesBurned ?? 0} kcal burned`}
                </p>
              </BreakdownCard>

              <BreakdownCard>
                <p className="text-sm font-medium text-gray-500">Macros</p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {dailyLoading
                    ? "…"
                    : `P ${Math.round(protein)} · C ${Math.round(carbs)} · F ${Math.round(fat)}`}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {dailyLoading ? "" : `Fiber ${Math.round(daily?.fiber ?? 0)}g`}
                </p>
                <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${macroWidths.p}%` }}
                  />
                  <div
                    className="bg-amber-400"
                    style={{ width: `${macroWidths.c}%` }}
                  />
                  <div
                    className="bg-sky-400"
                    style={{ width: `${macroWidths.f}%` }}
                  />
                </div>
              </BreakdownCard>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Health metrics
              </h3>
              <div className="mt-4">
                {dailyLoading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (daily?.healthMetrics ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No health metrics recorded for this date.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {(daily?.healthMetrics ?? []).map((m) => {
                      const pos = metricVisualPosition(m.metricType, m.value);
                      return (
                        <li key={m.id} className="py-4 first:pt-0">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {toMetricLabel(m.metricType)}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {new Date(m.recordedAt).toLocaleString()}
                                {m.notes ? ` · ${m.notes}` : ""}
                              </p>
                            </div>
                            <p className="text-base font-bold text-emerald-700">
                              {m.value} {m.unit}
                            </p>
                          </div>
                          <div className="relative mt-3 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow"
                              style={{ left: `${pos * 100}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "Weekly" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Weekly calories
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Consumed vs burned (7-day stacked bars)
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar
                      dataKey="consumed"
                      stackId="cal"
                      fill="#047857"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="burned"
                      stackId="cal"
                      fill="#a7f3d0"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {weeklyLoading ? (
                <p className="mt-3 text-sm text-gray-500">Loading…</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-700" />
                  Consumed
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-200" />
                  Burned
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "Monthly" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Monthly trends
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Weight trend and average sleep over the month
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Weight trend (kg)
                </h3>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyWeightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                      <YAxis tick={{ fill: "#6b7280" }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weightKg"
                        stroke="#047857"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#047857" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {monthlyLoading ? (
                  <p className="mt-2 text-sm text-gray-500">Loading…</p>
                ) : null}
                {!monthlyLoading && monthlyWeightData.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    No weight entries this month.
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Average sleep (hours)
                </h3>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySleepData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fill: "#6b7280" }} />
                      <YAxis tick={{ fill: "#6b7280" }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="sleepHoursAvg"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#0ea5e9" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {monthlyLoading ? (
                  <p className="mt-2 text-sm text-gray-500">Loading…</p>
                ) : null}
                {!monthlyLoading && monthlySleepData.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    No sleep entries this month.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Weekly performance
            </span>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Consistency is key
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Small daily wins with hydration and nutrition add up. Review your
              weekly charts to spot patterns and adjust before they become
              habits.
            </p>
            <button
              type="button"
              onClick={() => setTab("Weekly")}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View detailed insights
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-900 px-8 py-10 text-center shadow-md">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white ring-2 ring-white/20">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52a6.003 6.003 0 00-4.918 4.183 6.003 6.003 0 007.432 7.03 6.003 6.003 0 002.25-.566m0 0a6.003 6.003 0 002.25.566m0 0v.75m0-3.75v3.75"
                />
              </svg>
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">Elite tracker</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-emerald-100">
              You are in the top 5% of active users this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
