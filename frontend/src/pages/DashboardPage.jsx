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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Today: {todayString}</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "..." : card.value}
            </p>
            {card.subtext ? (
              <p className="mt-1 text-xs text-slate-500">{card.subtext}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Weekly Calorie Trend
          </h2>
          <p className="text-sm text-slate-500">Last 7 days</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Meals</h2>
          <ul className="mt-3 space-y-3">
            {meals.length === 0 ? (
              <li className="text-sm text-slate-500">
                No meals logged for today.
              </li>
            ) : (
              meals.slice(0, 8).map((meal) => (
                <li
                  key={meal.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{meal.foodName}</p>
                    <p className="text-xs uppercase text-slate-500">
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

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Water tracker</h2>
            <p className="mt-1 text-sm text-slate-600">
              {waterTotal} ml / {waterGoal} ml
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-sky-600 transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
