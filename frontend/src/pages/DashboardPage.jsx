import { useEffect, useMemo, useState } from "react";
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

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyReport, setDailyReport] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [fitnessLogs, setFitnessLogs] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => formatDate(today), [today]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const weekDates = [...Array(7)].map((_, index) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - index));
          return d;
        });

        const [dailyRes, nutritionRes, fitnessRes, ...dailyTrendResponses] =
          await Promise.all([
            axiosClient.get(`/reports/daily?date=${todayString}`),
            axiosClient.get(`/nutrition/logs?date=${todayString}`),
            axiosClient.get(`/fitness/logs?date=${todayString}`),
            ...weekDates.map((d) =>
              axiosClient.get(`/reports/daily?date=${formatDate(d)}`)
            ),
          ]);

        setDailyReport(dailyRes.data);
        setNutritionSummary(nutritionRes.data);
        setFitnessLogs(fitnessRes.data ?? []);
        setWeeklyTrend(
          dailyTrendResponses.map((response, idx) => ({
            day: shortDay(weekDates[idx]),
            calories: Number(response.data?.caloriesConsumed ?? 0),
          }))
        );
      } catch (err) {
        setError(err?.response?.data?.message ?? "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [today, todayString]);

  const exerciseMinutes = useMemo(
    () =>
      (fitnessLogs ?? []).reduce(
        (total, item) => total + Number(item.durationMinutes ?? 0),
        0
      ),
    [fitnessLogs]
  );

  const waterTotal = Number(dailyReport?.waterIntakeMl ?? 0);
  const waterGoal = 3000;
  const waterPct = Math.max(0, Math.min(100, Math.round((waterTotal / waterGoal) * 100)));

  const meals = nutritionSummary?.logs ?? [];
  const summaryCards = [
    {
      label: "Calories consumed",
      value: `${Math.round(Number(dailyReport?.caloriesConsumed ?? 0))} kcal`,
    },
    {
      label: "Water intake",
      value: `${Number(dailyReport?.waterIntakeMl ?? 0)} ml`,
    },
    {
      label: "Exercise minutes",
      value: `${exerciseMinutes} min`,
    },
    {
      label: "Calories burned",
      value: `${Number(dailyReport?.caloriesBurned ?? 0)} kcal`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Health Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your metabolic metrics for {todayString}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Live Sync On
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, idx) => (
          <article
            key={card.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="max-w-[11rem] text-sm font-medium text-slate-500">
                {card.label}
              </p>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {idx === 0 ? "🍽" : idx === 1 ? "💧" : idx === 2 ? "🔥" : "⚡"}
              </span>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Weekly Calorie Trend
            </h2>
            <p className="text-sm text-slate-500">Last 7 days</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Consumed
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">Today&apos;s Meals</h2>
            <span className="text-sm font-medium text-emerald-600">View all</span>
          </div>
          <ul className="mt-3 space-y-3">
            {meals.length === 0 ? (
              <li className="text-sm text-slate-500">
                No meals logged for today.
              </li>
            ) : (
              meals.slice(0, 8).map((meal) => (
                <li
                  key={meal.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5"
                >
                  <div>
                    <p className="font-medium text-slate-900">{meal.foodName}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                      {meal.mealType} • {meal.quantity}g
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {Math.round(Number(meal.calories ?? 0))} kcal
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Water Tracker</h2>
          <div className="mt-6 flex justify-center">
            <div className="relative grid h-52 w-52 place-items-center rounded-full bg-slate-50">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#3b82f6 ${waterPct}%, #e2e8f0 ${waterPct}% 100%)`,
                }}
              />
              <div className="relative grid h-40 w-40 place-items-center rounded-full bg-white">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {waterTotal.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">/ {waterGoal.toLocaleString()} ml</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-xl bg-sky-50 px-3 py-3 text-sm font-semibold text-sky-700"
            >
              + 250ml
            </button>
            <button
              type="button"
              className="rounded-xl bg-sky-50 px-3 py-3 text-sm font-semibold text-sky-700"
            >
              + 500ml
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
