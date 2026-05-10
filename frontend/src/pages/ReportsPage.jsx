import { useEffect, useMemo, useState } from "react";
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
    }[metricType] ?? metricType
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("Daily");
  const [error, setError] = useState("");

  // Daily state
  const [dailyDate, setDailyDate] = useState(yyyyMmDd(new Date()));
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Weekly state
  const [weeklyStart, setWeeklyStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return yyyyMmDd(d);
  });
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyBars, setWeeklyBars] = useState([]);

  // Monthly state
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Daily, weekly, and monthly insights.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium",
              tab === t
                ? "bg-slate-900 text-white"
                : "border bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tab === "Daily" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Daily breakdown
              </h2>
              <p className="text-sm text-slate-500">
                Calories, macros, water, exercise, and health metrics
              </p>
            </div>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Date</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="rounded border px-3 py-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Calories consumed"
              value={dailyLoading ? "…" : `${Math.round(daily?.caloriesConsumed ?? 0)} kcal`}
            />
            <StatCard
              label="Water"
              value={dailyLoading ? "…" : `${daily?.waterIntakeMl ?? 0} ml`}
            />
            <StatCard
              label="Exercise"
              value={dailyLoading ? "…" : `${daily?.exerciseMinutes ?? 0} min`}
              sub={dailyLoading ? "" : `${daily?.caloriesBurned ?? 0} kcal burned`}
            />
            <StatCard
              label="Macros"
              value={
                dailyLoading
                  ? "…"
                  : `P ${Math.round(daily?.protein ?? 0)} • C ${Math.round(
                      daily?.carbs ?? 0
                    )} • F ${Math.round(daily?.fat ?? 0)}`
              }
              sub={dailyLoading ? "" : `Fiber ${Math.round(daily?.fiber ?? 0)}g`}
            />
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Health metrics
            </h3>
            <div className="mt-3">
              {dailyLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (daily?.healthMetrics ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  No health metrics recorded for this date.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(daily?.healthMetrics ?? []).map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {toMetricLabel(m.metricType)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(m.recordedAt).toLocaleString()}
                          {m.notes ? ` • ${m.notes}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {m.value} {m.unit}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Weekly" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Weekly calories
              </h2>
              <p className="text-sm text-slate-500">
                Consumed vs burned (7-day stacked bars)
              </p>
            </div>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Start date</span>
              <input
                type="date"
                value={weeklyStart}
                onChange={(e) => setWeeklyStart(e.target.value)}
                className="rounded border px-3 py-2"
              />
            </label>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="consumed"
                    stackId="cal"
                    fill="#0f172a"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="burned"
                    stackId="cal"
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {weeklyLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            ) : null}
            <div className="mt-3 flex gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-slate-900" />
                Consumed
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-slate-400" />
                Burned
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Monthly" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly trends
              </h2>
              <p className="text-sm text-slate-500">
                Weight trend and average sleep over the month
              </p>
            </div>
            <div className="flex gap-2">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Month</span>
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
                  className="w-24 rounded border px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Year</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setMonthYear((prev) => ({
                      ...prev,
                      year: Number(e.target.value),
                    }))
                  }
                  className="w-28 rounded border px-3 py-2"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Weight trend (kg)
              </h3>
              <div className="mt-3 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyWeightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weightKg"
                      stroke="#0f172a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {monthlyLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading…</p>
              ) : null}
              {!monthlyLoading && monthlyWeightData.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No weight entries this month.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Average sleep (hours)
              </h3>
              <div className="mt-3 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySleepData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sleepHoursAvg"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {monthlyLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading…</p>
              ) : null}
              {!monthlyLoading && monthlySleepData.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No sleep entries this month.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
