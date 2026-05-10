import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import useAuthStore from "../store/authStore";

function parseEmailFromToken(token) {
  try {
    if (!token) return "";
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "";
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const payload = JSON.parse(json);
    return payload?.sub ?? "";
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const token = useAuthStore((state) => state.token);
  const email = useMemo(() => parseEmailFromToken(token), [token]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    heightCm: "",
    dailyWaterGoalMl: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosClient.get("/profile");
        const data = res.data ?? {};
        if (!cancelled) {
          setForm({
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            dateOfBirth: data.dateOfBirth ?? "",
            gender: data.gender ?? "",
            heightCm: data.heightCm ?? "",
            dailyWaterGoalMl: data.dailyWaterGoalMl ?? 3000,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await axiosClient.put("/profile", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        heightCm: form.heightCm === "" ? null : Number(form.heightCm),
        profilePicUrl: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
        dailyWaterGoalMl:
          form.dailyWaterGoalMl === "" ? null : Number(form.dailyWaterGoalMl),
      });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Unexpected error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your personal information.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
        <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={onSave}>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">First name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={onChange("firstName")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Last name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={onChange("lastName")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded border bg-slate-50 px-3 py-2 text-slate-500"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Date of birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={onChange("dateOfBirth")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Gender</span>
            <select
              value={form.gender}
              onChange={onChange("gender")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Height (cm)</span>
            <input
              type="number"
              min={0}
              value={form.heightCm}
              onChange={onChange("heightCm")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Daily water goal (ml)</span>
            <input
              type="number"
              min={0}
              value={form.dailyWaterGoalMl}
              onChange={onChange("dailyWaterGoalMl")}
              disabled={loading || saving}
              className="w-full rounded border px-3 py-2 disabled:bg-slate-50"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading || saving}
              className="mt-1 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
