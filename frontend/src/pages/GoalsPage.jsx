import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  daysFromNowLocal,
  todayLocal,
} from "../utils/dateUtils";

const GOAL_TYPES = [
  { value: "WEIGHT_LOSS", label: "Weight loss", unit: "kg" },
  { value: "WEIGHT_GAIN", label: "Weight gain", unit: "kg" },
  { value: "CALORIE_TARGET", label: "Calorie target", unit: "kcal" },
  { value: "WATER_INTAKE", label: "Water intake", unit: "ml" },
  { value: "EXERCISE_MINUTES", label: "Exercise minutes", unit: "min" },
  { value: "SLEEP_HOURS", label: "Sleep hours", unit: "hours" },
];

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
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#d1fae5"
          strokeWidth="5"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-emerald-900">
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
      targetDate: daysFromNowLocal(14),
    },
  });

  const watchedType = watch("goalType");
  const watchedTypeMeta = GOAL_TYPES.find((t) => t.value === watchedType);

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
    if (values.targetDate < todayLocal()) {
      setError("Target date cannot be in the past.");
      return;
    }

    setError("");
    try {
      const meta = GOAL_TYPES.find((t) => t.value === values.goalType);
      await axiosClient.post("/goals", {
        goalType: values.goalType,
        targetValue: Number(values.targetValue),
        currentValue: 0,
        unit: meta?.unit ?? "units",
        startDate: todayLocal(),
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

  const fieldClass =
    "w-full rounded-lg border border-emerald-100/80 bg-emerald-50/80 px-3 py-2.5 text-sm text-gray-900 outline-none ring-emerald-500/20 transition-[box-shadow,border-color] focus:border-emerald-400 focus:ring-2";

  return (
    <div className="-mx-4 -mt-4 bg-emerald-50/90 px-6 py-8 pb-24 md:-mx-6 md:-mt-6 md:px-8 md:pb-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Goals
          </h1>
          
        </div>

        <div>
          
          <p className="mt-1 text-sm text-gray-500">
            Track active goals and monitor progress.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active goals
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                {activeGoals.length}{" "}
                {activeGoals.length === 1 ? "goal" : "goals"}
              </p>
            </div>

            <div className="pt-5">
              {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : activeGoals.length === 0 ? (
                <p className="text-sm text-gray-500">No active goals yet.</p>
              ) : (
                <>
                  <ul className="space-y-4">
                    {activeGoals.map((goal) => {
                      const pct = percent(
                        goal.currentValue,
                        goal.targetValue
                      );
                      const typeLabel =
                        GOAL_TYPES.find((t) => t.value === goal.goalType)
                          ?.label ?? goal.goalType;
                      return (
                        <li
                          key={goal.id}
                          className="flex flex-col gap-4 rounded-xl border border-emerald-100/60 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <CircleProgress valuePercent={pct} />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">
                                <span className="text-emerald-700">•</span>{" "}
                                {typeLabel}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                {goal.currentValue} {goal.unit}{" "}
                                <span className="text-gray-400">/</span>{" "}
                                {goal.targetValue} {goal.unit}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Target date: {goal.targetDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => updateStatus(goal, "ACHIEVED")}
                              className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-950"
                            >
                              Achieved
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(goal, "ABANDONED")}
                              className="rounded-lg border-2 border-emerald-700 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50/80"
                            >
                              Abandon
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-8 flex flex-col items-center justify-center gap-2 py-2 text-center">
                    <svg
                      className="h-8 w-8 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6H3.5M3 21H19a2 2 0 002-2v-6a2 2 0 00-2-2h-3.28a1 1 0 01-.948-.684l-1.498-4.493a1 1 0 00-.95-.69H5a2 2 0 00-2 2v11"
                      />
                    </svg>
                    <p className="max-w-sm text-sm italic text-gray-400">
                      No other active goals tracked at this time.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Create goal</h3>
            <form
              className="mt-5 flex flex-col gap-4"
              onSubmit={handleSubmit(onCreate)}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Type
                </span>
                <select
                  {...register("goalType", { required: true })}
                  className={fieldClass}
                >
                  {GOAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Target value
                </span>
                <div className="flex rounded-lg border border-emerald-100/80 bg-emerald-50/80 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <input
                    {...register("targetValue", { required: true, min: 0 })}
                    type="number"
                    step="0.01"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 outline-none"
                  />
                  <span className="flex items-center border-l border-emerald-100/80 bg-emerald-50/50 px-3 text-sm font-medium text-emerald-900/80">
                    {watchedTypeMeta?.unit ?? ""}
                  </span>
                </div>
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-700">
                  Target date
                </span>
                <input
                  {...register("targetDate", {
                    required: true,
                    validate: (value) =>
                      value >= todayLocal() || "Target date cannot be in the past",
                  })}
                  type="date"
                  min={todayLocal()}
                  className={fieldClass}
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Create"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/90 p-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm ring-1 ring-emerald-100/80">
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
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3m-3 0h6"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Pro Tip
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Users who set small, achievable weekly goals are 3x more
                    likely to reach their long-term health targets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 shadow-md">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center blur-sm"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(6, 78, 59, 0.85) 0%, rgba(15, 23, 42, 0.75) 50%, rgba(4, 120, 87, 0.7) 100%), repeating-linear-gradient(-12deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-emerald-950/20" aria-hidden />
            
        </section>
      </div>
    </div>
  );
}
