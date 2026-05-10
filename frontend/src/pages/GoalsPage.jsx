import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../api/axiosClient";

const GOAL_TYPES = [
  { value: "WEIGHT_LOSS", label: "Weight loss", unit: "kg" },
  { value: "WEIGHT_GAIN", label: "Weight gain", unit: "kg" },
  { value: "CALORIE_TARGET", label: "Calorie target", unit: "kcal" },
  { value: "WATER_INTAKE", label: "Water intake", unit: "ml" },
  { value: "EXERCISE_MINUTES", label: "Exercise minutes", unit: "min" },
  { value: "SLEEP_HOURS", label: "Sleep hours", unit: "hours" },
];

function yyyyMmDd(date) {
  return date.toISOString().slice(0, 10);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function percent(current, target) {
  const t = Number(target ?? 0);
  if (t <= 0) return 0;
  return Math.round(clamp01(Number(current ?? 0) / t) * 100);
}

function CircleProgress({ valuePercent }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (valuePercent / 100) * c;
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="6"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-900">
        {valuePercent}%
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      goalType: "CALORIE_TARGET",
      targetValue: 2000,
      targetDate: yyyyMmDd(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    },
  });

  const watchedType = watch("goalType");

  useEffect(() => {
    const meta = GOAL_TYPES.find((t) => t.value === watchedType);
    if (meta) {
      setValue("unit", meta.unit);
    }
  }, [setValue, watchedType]);

  const loadGoals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/goals");
      setGoals(res.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGoals = useMemo(
    () => (goals ?? []).filter((g) => g.status === "ACTIVE"),
    [goals]
  );

  const onCreate = async (values) => {
    setError("");
    try {
      const meta = GOAL_TYPES.find((t) => t.value === values.goalType);
      await axiosClient.post("/goals", {
        goalType: values.goalType,
        targetValue: Number(values.targetValue),
        currentValue: 0,
        unit: meta?.unit ?? "units",
        startDate: yyyyMmDd(new Date()),
        targetDate: values.targetDate,
        status: "ACTIVE",
      });
      reset({
        goalType: values.goalType,
        targetValue: values.targetValue,
        targetDate: values.targetDate,
      });
      await loadGoals();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to create goal");
    }
  };

  const updateStatus = async (goal, status) => {
    setError("");
    try {
      await axiosClient.put(`/goals/${goal.id}`, {
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        status,
      });
      await loadGoals();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to update goal");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track active goals and monitor progress.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Active goals
              </h2>
              <p className="text-sm text-slate-500">
                {activeGoals.length}{" "}
                {activeGoals.length === 1 ? "goal" : "goals"}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : activeGoals.length === 0 ? (
            <p className="text-sm text-slate-500">No active goals yet.</p>
          ) : (
            <ul className="space-y-3">
              {activeGoals.map((goal) => {
                const pct = percent(goal.currentValue, goal.targetValue);
                const typeLabel =
                  GOAL_TYPES.find((t) => t.value === goal.goalType)?.label ??
                  goal.goalType;
                return (
                  <li
                    key={goal.id}
                    className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CircleProgress valuePercent={pct} />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {typeLabel}
                        </p>
                        <p className="text-sm text-slate-600">
                          {goal.currentValue} {goal.unit}{" "}
                          <span className="text-slate-400">/</span>{" "}
                          {goal.targetValue} {goal.unit}
                        </p>
                        <p className="text-xs text-slate-500">
                          Target date: {goal.targetDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(goal, "ACHIEVED")}
                        className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Achieved
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(goal, "ABANDONED")}
                        className="rounded-md border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Abandon
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create goal</h2>
          <form className="mt-3 space-y-3" onSubmit={handleSubmit(onCreate)}>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Type</span>
              <select
                {...register("goalType", { required: true })}
                className="w-full rounded border px-3 py-2"
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Target value</span>
              <input
                {...register("targetValue", { required: true, min: 0 })}
                type="number"
                step="0.01"
                className="w-full rounded border px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Target date</span>
              <input
                {...register("targetDate", { required: true })}
                type="date"
                className="w-full rounded border px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Create"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
