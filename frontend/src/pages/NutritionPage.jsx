import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

// Baseline daily targets (can be wired to Goals/Profile later)
const TARGETS = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 70,
};

function yyyyMmDd(date) {
  return date.toISOString().slice(0, 10);
}

function round0(n) {
  return Math.round(Number(n ?? 0));
}

function round1(n) {
  return Math.round(Number(n ?? 0) * 10) / 10;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function sumMacro(items, key) {
  return items.reduce((acc, it) => acc + Number(it?.[key] ?? 0), 0);
}

function MacroRow({ label, value, target, unit = "g" }) {
  const pct = clamp01(target > 0 ? value / target : 0);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {round1(value)}
          {unit}{" "}
          <span className="font-normal text-gray-500">
            / {target}
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-green-500 transition-[width]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

function FoodSearchModal({
  open,
  onClose,
  onLogged,
  dateString,
  defaultMealType = "LUNCH",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mealType, setMealType] = useState(defaultMealType);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setMealType(defaultMealType);
    setQuantity(100);
    setError("");
  }, [defaultMealType, open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosClient.get("/foods/search", {
          params: { query: trimmed },
        });
        if (!cancelled) setResults(res.data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? "Search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  const handleLog = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await axiosClient.post("/nutrition/log", {
        foodItemId: selected.id,
        mealType,
        quantity: Number(quantity),
        logDate: dateString,
      });
      onLogged?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Add food</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-gray-700">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. banana, oats, milk..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none ring-green-500/30 focus:border-green-500 focus:ring-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Type at least 2 characters.
              </p>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">Meal</span>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none ring-green-500/30 focus:border-green-500 focus:ring-2"
              >
                {MEAL_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 text-sm font-semibold text-gray-800">
                Results
              </div>
              <div className="max-h-72 overflow-auto p-3">
                {loading && results.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-gray-500">Loading…</p>
                ) : null}
                {results.length === 0 && !loading ? (
                  <p className="px-2 py-2 text-sm text-gray-500">
                    No results yet.
                  </p>
                ) : null}
                <ul className="space-y-2">
                  {results.map((item) => {
                    const isActive = selected?.id === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className={[
                            "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                            isActive
                              ? "border-green-500 bg-green-50"
                              : "border-transparent hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-gray-900">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-xs text-gray-500">
                              {round0(item.calories)} kcal/100g
                            </span>
                          </div>
                          {item.brand ? (
                            <div className="mt-1 text-xs text-gray-500">
                              {item.brand}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
              <div className="text-sm font-semibold text-gray-800">Selected</div>
              {selected ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selected.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Per 100g: {round0(selected.calories)} kcal • P{" "}
                      {round1(selected.protein)}g • C {round1(selected.carbs)}g
                      • F {round1(selected.fat)}g
                    </p>
                  </div>

                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-gray-700">
                      Quantity (grams)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none ring-green-500/30 focus:border-green-500 focus:ring-2"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLog}
                    disabled={loading}
                    className="w-full rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600 disabled:opacity-60"
                  >
                    {loading ? "Logging…" : "Log food"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Choose a food from the results to log it.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMealType, setModalMealType] = useState("LUNCH");
  const [summary, setSummary] = useState(null);
  const [water, setWater] = useState(null);

  const todayString = useMemo(() => yyyyMmDd(new Date()), []);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const [nutritionRes, waterRes] = await Promise.all([
        axiosClient.get("/nutrition/logs", { params: { date: todayString } }),
        axiosClient.get("/nutrition/water", { params: { date: todayString } }),
      ]);
      setSummary(nutritionRes.data);
      setWater(waterRes.data);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load nutrition");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logs = summary?.logs ?? [];
  const grouped = useMemo(() => {
    const buckets = Object.fromEntries(MEAL_TYPES.map((t) => [t, []]));
    for (const log of logs) {
      const key = log.mealType ?? "SNACK";
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(log);
    }
    return buckets;
  }, [logs]);

  const totals = useMemo(() => {
    return {
      calories: Number(summary?.totalCalories ?? 0),
      protein: Number(summary?.totalProtein ?? 0),
      carbs: Number(summary?.totalCarbs ?? 0),
      fat: Number(summary?.totalFat ?? 0),
    };
  }, [summary]);

  const waterTotal = Number(water?.totalMl ?? 0);
  const waterGoal = Number(water?.dailyGoalMl ?? 0);
  const waterPct = clamp01(waterGoal > 0 ? waterTotal / waterGoal : 0);

  const quickAddWater = async (amountMl) => {
    setError("");
    try {
      await axiosClient.post("/nutrition/water", {
        amountMl,
        loggedAt: new Date().toISOString(),
      });
      await reload();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log water");
    }
  };

  const mealTotals = (mealType) => {
    const items = grouped[mealType] ?? [];
    return {
      calories: sumMacro(items, "calories"),
      protein: sumMacro(items, "protein"),
      carbs: sumMacro(items, "carbs"),
      fat: sumMacro(items, "fat"),
    };
  };

  const openAddFood = (mealType) => {
    setModalMealType(mealType);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Nutrition
          </h1>
          <p className="mt-1 text-sm text-gray-500">Today: {todayString}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications"
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
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </button>
          <button
            type="button"
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
          </button>
          <button
            type="button"
            onClick={() => openAddFood("LUNCH")}
            className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-600"
          >
            Add food
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Daily progress</h2>
          <p className="mt-1 text-sm text-gray-500">
            Targets are defaults for now (can be personalized later).
          </p>

          <div className="mt-6 space-y-5">
            <MacroRow
              label="Calories"
              value={totals.calories}
              target={TARGETS.calories}
              unit=" kcal"
            />
            <MacroRow label="Protein" value={totals.protein} target={TARGETS.protein} />
            <MacroRow label="Carbs" value={totals.carbs} target={TARGETS.carbs} />
            <MacroRow label="Fat" value={totals.fat} target={TARGETS.fat} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M12 2.25c.53 0 1.04.21 1.41.59l.09.09c.85.85 2.24 2.56 3.31 4.69 1.02 2.03 1.45 4.13.81 5.77-.48 1.2-1.45 2.08-2.87 2.44V20a2.25 2.25 0 01-4.5 0v-4.17c-1.42-.36-2.39-1.24-2.87-2.44-.64-1.64-.21-3.74.81-5.77 1.07-2.13 2.46-3.84 3.31-4.69l.09-.09A2 2 0 0112 2.25z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Water</h2>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            {waterTotal} ml{" "}
            {waterGoal ? (
              <span className="font-normal text-gray-500">/ {waterGoal} ml</span>
            ) : null}
          </p>
          <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100">
            <div
              className="h-2.5 rounded-full bg-sky-500 transition-[width]"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[250, 500, 750, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => quickAddWater(amt)}
                className="rounded-xl border border-gray-200 bg-gray-50/80 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                +{amt}ml
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {MEAL_TYPES.map((mealType) => {
          const items = grouped[mealType] ?? [];
          const mt = mealTotals(mealType);
          const hasItems = items.length > 0;
          return (
            <div
              key={mealType}
              className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div
                className={[
                  "w-1.5 shrink-0 self-stretch",
                  hasItems ? "bg-green-500" : "bg-gray-300",
                ].join(" ")}
                aria-hidden
              />
              <div className="min-w-0 flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wide text-gray-900">
                      {mealType}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {round0(mt.calories)} kcal • P {round1(mt.protein)}g • C{" "}
                      {round1(mt.carbs)}g • F {round1(mt.fat)}g
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddFood(mealType)}
                    className="shrink-0 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading…</p>
                  ) : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-10 text-center text-sm text-gray-500">
                      No items logged.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((log) => (
                        <li
                          key={log.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/70 px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm ring-1 ring-green-100">
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
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900">
                                {log.foodName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.quantity}g • P {round1(log.protein)}g • C{" "}
                                {round1(log.carbs)}g • F {round1(log.fat)}g
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-gray-900">
                            {round0(log.calories)} kcal
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <FoodSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLogged={reload}
        dateString={todayString}
        defaultMealType={modalMealType}
      />
    </div>
  );
}
