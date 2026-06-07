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
import {
  addDaysLocal,
  formatLocalDate,
  parseApiDateTime,
  parseLocalDate,
  todayLocal,
} from "../utils/dateUtils";

const TABS = ["Daily", "Weekly", "Monthly"];
const DEFAULT_CALORIE_GOAL = 2000;

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

  const [dailyDate, setDailyDate] = useState(todayLocal());
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [weeklyStart, setWeeklyStart] = useState(() =>
    formatLocalDate(addDaysLocal(new Date(), -6))
  );
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
        const start = parseLocalDate(weeklyStart);
        const dates = [...Array(7)].map((_, idx) => addDaysLocal(start, idx));
        const responses = await Promise.all(
          dates.map((d) =>
            axiosClient.get("/reports/daily", { params: { date: formatLocalDate(d) } })
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
                                {parseApiDateTime(m.recordedAt)?.toLocaleString()}
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
            
          </div>

          
        </div>
      </div>
    </div>
  );
}
