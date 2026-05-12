import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
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

  const yAxisMax = useMemo(() => {
    const maxMin = Math.max(
      0,
      ...weeklyMinutes.map((d) => Number(d.minutes ?? 0))
    );
    const step = 40;
    return Math.max(160, Math.ceil(maxMin / step) * step);
  }, [weeklyMinutes]);

  const yAxisTicks = useMemo(() => {
    const step = 40;
    const ticks = [];
    for (let v = 0; v <= yAxisMax; v += step) ticks.push(v);
    return ticks;
  }, [yAxisMax]);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-[box-shadow,border-color] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

  return (
    <div className="-mx-4 -mt-4 bg-slate-50 px-6 py-8 pb-24 md:-mx-6 md:-mt-6 md:px-8 md:pb-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Fitness
            </h1>
            <p className="mt-1 text-sm text-slate-500">Today: {todayString}</p>
          </div>
          <Link
            to="/nutrition"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            Add food
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Weekly Exercise Minutes
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">Last 7 days</p>
            </div>
            <div className="h-72 w-full min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyMinutes}
                  margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    domain={[0, yAxisMax]}
                    ticks={yAxisTicks}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Bar
                    dataKey="minutes"
                    fill="#0f172a"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Loading chart…</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Log exercise</h2>
            <form
              className="mt-5 flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Exercise name
                </span>
                <input
                  {...register("exerciseName", { required: true })}
                  className={inputClass}
                  placeholder="e.g. Running, Pushups"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-slate-700">
                    Category
                  </span>
                  <select
                    {...register("category", { required: true })}
                    className={inputClass}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-slate-700">
                    Duration (min)
                  </span>
                  <input
                    {...register("durationMinutes", { required: true, min: 1 })}
                    type="number"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Calories burned
                </span>
                <input
                  {...register("caloriesBurned", { required: true, min: 0 })}
                  type="number"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className={inputClass}
                  placeholder="Optional notes"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-lg bg-slate-900 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Add"}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Today&apos;s exercises
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {todayLogs.length}{" "}
              {todayLogs.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : todayLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No exercises logged today.</p>
          ) : (
            <ul className="space-y-3">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {log.exerciseName}
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                      <span className="uppercase tracking-wide">
                        {log.category}
                      </span>
                      {log.notes ? (
                        <span> • {log.notes}</span>
                      ) : (
                        <span className="uppercase tracking-wide">
                          {" "}
                          • Logged from exercise recommendations
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-base font-bold text-slate-900">
                      {log.durationMinutes} min
                    </p>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {log.caloriesBurned} kcal
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
