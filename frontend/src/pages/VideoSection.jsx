import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const VIDEOS = [
  {
    id: "vid-1",
    title: "30 Min Fat Burn Cardio",
    instructor: "Coach Maya",
    duration: "30 min",
    thumbnail: "https://img.youtube.com/vi/ml6cT4AZdqI/hqdefault.jpg",
    youtubeEmbedUrl: "https://www.youtube.com/embed/ml6cT4AZdqI",
  },
  {
    id: "vid-2",
    title: "Full Body Strength Basics",
    instructor: "Coach Ethan",
    duration: "25 min",
    thumbnail: "https://img.youtube.com/vi/U0bhE67HuDY/hqdefault.jpg",
    youtubeEmbedUrl: "https://www.youtube.com/embed/U0bhE67HuDY",
  },
  {
    id: "vid-3",
    title: "Mobility and Stretch Routine",
    instructor: "Coach Ava",
    duration: "20 min",
    thumbnail: "https://img.youtube.com/vi/v7AYKMP6rOE/hqdefault.jpg",
    youtubeEmbedUrl: "https://www.youtube.com/embed/v7AYKMP6rOE",
  },
];

function normalizeGoalType(value) {
  if (!value) return "General Fitness";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function VideoModal({ video, onClose, onLogWorkout, logLoading }) {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-slate-900">{video.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="overflow-hidden rounded-lg border">
            <iframe
              className="h-72 w-full"
              src={video.youtubeEmbedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {video.instructor} • {video.duration}
            </p>
            <button
              type="button"
              onClick={() => onLogWorkout(video.id)}
              disabled={logLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {logLoading ? "Logging..." : "Log workout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoSection() {
  const [goalType, setGoalType] = useState("General Fitness");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [error, setError] = useState("");
  const [logLoading, setLogLoading] = useState(false);

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

  const logWorkout = async (videoId) => {
    setError("");
    setLogLoading(true);
    try {
      await axiosClient.post(`/exercises/log/${videoId}`);
      setSelectedVideo(null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to log workout");
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recommended for you</h1>
          <p className="mt-1 text-sm text-slate-600">
            Personalized videos based on your goal.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Goal: {goalType}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {VIDEOS.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setSelectedVideo(video)}
            className="overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:border-slate-300"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-44 w-full object-cover"
            />
            <div className="space-y-1 p-4">
              <p className="font-semibold text-slate-900">{video.title}</p>
              <p className="text-sm text-slate-600">{video.instructor}</p>
              <p className="text-xs text-slate-500">{video.duration}</p>
            </div>
          </button>
        ))}
      </div>

      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onLogWorkout={logWorkout}
        logLoading={logLoading}
      />
    </div>
  );
}
