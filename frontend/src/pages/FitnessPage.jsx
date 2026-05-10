import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosClient from "../api/axiosClient";

const CATEGORIES = ["CARDIO", "STRENGTH", "FLEXIBILITY", "OTHER"];

function yyyyMmDd(date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function FitnessPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayLogs, setTodayLogs] = useState([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState([]);

  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => yyyyMmDd(today), [today]);

  const weekRange = useMemo(() => {
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(end.getDate() - 6);
    return { start, end };
  }, [today]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      exerciseName: "",
      category: "CARDIO",
      durationMinutes: 30,
      caloriesBurned: 200,
      notes: "",
    },
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [todayRes, historyRes] = await Promise.all([
        axiosClient.get("/fitness/logs", { params: { date: todayString } }),
        axiosClient.get("/fitness/history", {
          params: {
            startDate: yyyyMmDd(weekRange.start),
            endDate: yyyyMmDd(weekRange.end),
          },
        }),
      ]);

      const todays = todayRes.data ?? [];
      const history = historyRes.data ?? [];

      setTodayLogs(todays);

      const dayBuckets = new Map();
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(weekRange.start);
        d.setDate(d.getDate() + i);
        dayBuckets.set(yyyyMmDd(d), { day: shortDay(d), minutes: 0 });
      }
      for (const log of history) {
        const key = log.logDate;
        if (dayBuckets.has(key)) {
          dayBuckets.get(key).minutes += Number(log.durationMinutes ?? 0);
        }
      }

      setWeeklyMinutes([...dayBuckets.values()]);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load fitness data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayString]);

  const onSubmit = async (values) => {
    setError("");
    try {
      await axiosClient.post("/fitness/log", {
        exerciseName: values.exerciseName,
        category: values.category,
        durationMinutes: Number(values.durationMinutes),
        caloriesBurned: Number(values.caloriesBurned),
        notes: values.notes,
        logDate: todayString,
      });
      reset({
        exerciseName: "",
        category: values.category,
        durationMinutes: values.durationMinutes,
        caloriesBurned: values.caloriesBurned,
        notes: "",
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log exercise");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fitness</h1>
        <p className="mt-1 text-sm text-slate-600">Today: {todayString}</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Weekly Exercise Minutes
            </h2>
            <p className="text-sm text-slate-500">Last 7 days</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyMinutes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-slate-500">Loading chart…</p>
          ) : null}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Log exercise</h2>
          <form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Exercise name</span>
              <input
                {...register("exerciseName", { required: true })}
                className="w-full rounded border px-3 py-2"
                placeholder="e.g. Running, Pushups"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Category</span>
                <select
                  {...register("category", { required: true })}
                  className="w-full rounded border px-3 py-2"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Duration (min)</span>
                <input
                  {...register("durationMinutes", { required: true, min: 1 })}
                  type="number"
                  className="w-full rounded border px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Calories burned</span>
              <input
                {...register("caloriesBurned", { required: true, min: 0 })}
                type="number"
                className="w-full rounded border px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Notes</span>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full rounded border px-3 py-2"
                placeholder="Optional notes"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Add"}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Today&apos;s exercises
            </h2>
            <p className="text-sm text-slate-500">
              {todayLogs.length} {todayLogs.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : todayLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No exercises logged today.</p>
        ) : (
          <ul className="space-y-2">
            {todayLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-900">{log.exerciseName}</p>
                  <p className="text-xs uppercase text-slate-500">
                    {log.category}
                    {log.notes ? ` • ${log.notes}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {log.durationMinutes} min
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.caloriesBurned} kcal
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
