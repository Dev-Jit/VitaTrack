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
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">
          {round1(value)}
          {unit}{" "}
          <span className="text-slate-500">
            / {target}
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-900"
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
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-slate-900">Add food</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. banana, oats, milk..."
                className="w-full rounded border px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Type at least 2 characters.
              </p>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Meal</span>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded border px-3 py-2"
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border">
              <div className="border-b px-3 py-2 text-sm font-medium text-slate-700">
                Results
              </div>
              <div className="max-h-72 overflow-auto p-2">
                {loading && results.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-slate-500">Loading…</p>
                ) : null}
                {results.length === 0 && !loading ? (
                  <p className="px-2 py-2 text-sm text-slate-500">
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
                            "w-full rounded-md border px-3 py-2 text-left text-sm",
                            isActive
                              ? "border-slate-900 bg-slate-50"
                              : "hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-900">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {round0(item.calories)} kcal/100g
                            </span>
                          </div>
                          {item.brand ? (
                            <div className="mt-1 text-xs text-slate-500">
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

            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-slate-700">Selected</div>
              {selected ? (
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selected.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Per 100g: {round0(selected.calories)} kcal • P{" "}
                      {round1(selected.protein)}g • C {round1(selected.carbs)}g
                      • F {round1(selected.fat)}g
                    </p>
                  </div>

                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600">
                      Quantity (grams)
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded border px-3 py-2"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLog}
                    disabled={loading}
                    className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {loading ? "Logging…" : "Log food"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nutrition</h1>
          <p className="mt-1 text-sm text-slate-600">Today: {todayString}</p>
        </div>
        <button
          type="button"
          onClick={() => openAddFood("LUNCH")}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add food
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Daily progress
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Targets are defaults for now (can be personalized later).
          </p>

          <div className="mt-4 space-y-4">
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

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Water</h2>
          <p className="mt-1 text-sm text-slate-500">
            {waterTotal} ml{" "}
            {waterGoal ? <span> / {waterGoal} ml</span> : null}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-sky-600"
              style={{ width: `${waterPct * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[250, 500, 750, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => quickAddWater(amt)}
                className="rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                +{amt}ml
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {MEAL_TYPES.map((mealType) => {
          const items = grouped[mealType] ?? [];
          const mt = mealTotals(mealType);
          return (
            <div key={mealType} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {mealType}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {round0(mt.calories)} kcal • P {round1(mt.protein)}g • C{" "}
                    {round1(mt.carbs)}g • F {round1(mt.fat)}g
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddFood(mealType)}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                >
                  Add
                </button>
              </div>

              <div className="mt-4">
                {loading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : items.length === 0 ? (
                  <p className="text-sm text-slate-500">No items logged.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((log) => (
                      <li
                        key={log.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {log.foodName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.quantity}g • P {round1(log.protein)}g • C{" "}
                            {round1(log.carbs)}g • F {round1(log.fat)}g
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          {round0(log.calories)} kcal
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
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
