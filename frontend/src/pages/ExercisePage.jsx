import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";

const CATEGORY_PILLS = ["All", "Cardio", "Strength", "Flexibility", "Recovery"];

const DAILY_PLAN = [
  {
    id: 1,
    name: "Morning Walk",
    duration: "20 min",
    calories: 110,
    difficulty: "Easy",
    category: "Cardio",
    description:
      "A light-intensity walk to wake up the body and improve circulation.",
    videoUrl: "https://www.youtube.com/embed/ml6cT4AZdqI",
  },
  {
    id: 2,
    name: "Bodyweight Squats",
    duration: "15 min",
    calories: 140,
    difficulty: "Medium",
    category: "Strength",
    description:
      "Build lower-body strength and endurance with controlled squat sets.",
    videoUrl: "https://www.youtube.com/embed/aclHkVaku9U",
  },
  {
    id: 3,
    name: "Plank Core Circuit",
    duration: "12 min",
    calories: 90,
    difficulty: "Medium",
    category: "Strength",
    description:
      "Core-focused plank routine for stability, posture, and balance.",
    videoUrl: "",
  },
  {
    id: 4,
    name: "Yoga Stretch Flow",
    duration: "18 min",
    calories: 80,
    difficulty: "Easy",
    category: "Flexibility",
    description: "Gentle flow to improve flexibility and reduce muscle tension.",
    videoUrl: "https://www.youtube.com/embed/v7AYKMP6rOE",
  },
  {
    id: 5,
    name: "Breathing Cooldown",
    duration: "10 min",
    calories: 45,
    difficulty: "Easy",
    category: "Recovery",
    description:
      "Guided breathing and cooldown sequence to recover after workouts.",
    videoUrl: "",
  },
];

function difficultyBadgeClass(level) {
  if (level === "Easy") return "bg-emerald-100 text-emerald-700";
  if (level === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function normalizeGoalType(value) {
  if (!value) return "General Fitness";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ExerciseDetailModal({ exercise, onClose }) {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-slate-900">{exercise.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">{exercise.description}</p>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <p className="rounded-md bg-slate-50 px-3 py-2">{exercise.duration}</p>
            <p className="rounded-md bg-slate-50 px-3 py-2">
              {exercise.calories} kcal
            </p>
            <p className="rounded-md bg-slate-50 px-3 py-2">{exercise.difficulty}</p>
          </div>
          {exercise.videoUrl ? (
            <div className="overflow-hidden rounded-lg border">
              <iframe
                className="h-64 w-full"
                src={exercise.videoUrl}
                title={exercise.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No video available for this exercise.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExercisePage() {
  const [goalType, setGoalType] = useState("General Fitness");
  const [activeCategory, setActiveCategory] = useState("All");
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadGoal = async () => {
      try {
        const res = await axiosClient.get("/goals");
        const activeGoal = (res.data ?? []).find((goal) => goal.status === "ACTIVE");
        if (!cancelled) {
          setGoalType(normalizeGoalType(activeGoal?.goalType));
        }
      } catch {
        if (!cancelled) setGoalType("General Fitness");
      }
    };
    loadGoal();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredExercises = useMemo(() => {
    if (activeCategory === "All") return DAILY_PLAN;
    return DAILY_PLAN.filter((exercise) => exercise.category === activeCategory);
  }, [activeCategory]);

  const progress = completedIds.length;
  const progressPercent = Math.round((progress / DAILY_PLAN.length) * 100);

  const markDone = async (id) => {
    if (completedIds.includes(id)) return;
    setError("");
    setPendingId(id);
    try {
      await axiosClient.post(`/exercises/log/${id}`);
      setCompletedIds((prev) => [...prev, id]);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to mark exercise as done");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-sm text-slate-300">Daily target</p>
        <h1 className="mt-1 text-2xl font-bold">Your goal: {goalType}</h1>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Daily plan</h2>
          <p className="text-sm font-medium text-slate-700">
            {progress}/{DAILY_PLAN.length}
          </p>
        </div>
        <div className="mb-4 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {DAILY_PLAN.map((exercise) => {
            const done = completedIds.includes(exercise.id);
            return (
              <article
                key={exercise.id}
                className="rounded-lg border p-3 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{exercise.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {exercise.duration} • {exercise.calories} kcal
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      difficultyBadgeClass(exercise.difficulty),
                    ].join(" ")}
                  >
                    {exercise.difficulty}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(exercise)}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    onClick={() => markDone(exercise.id)}
                    disabled={done || pendingId === exercise.id}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium",
                      done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-900 text-white hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {done ? "Done ✓" : pendingId === exercise.id ? "Saving..." : "Mark done"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PILLS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={[
                "rounded-full px-4 py-1.5 text-sm transition",
                activeCategory === category
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => setSelectedExercise(exercise)}
              className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
            >
              <p className="font-semibold text-slate-900">{exercise.name}</p>
              <p className="mt-1 text-sm text-slate-500">{exercise.category}</p>
              <p className="mt-3 text-xs text-slate-600">
                {exercise.duration} • {exercise.calories} kcal
              </p>
            </button>
          ))}
        </div>
      </section>

      <ExerciseDetailModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}
