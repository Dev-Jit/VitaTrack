import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import useAuthStore from "../store/authStore";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const { register, handleSubmit } = useForm();
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    setError("");
    try {
      const data = await authApi.register(values);
      setToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Registration failed");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Create your account</h1>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("email", { required: true })}
          placeholder="Email"
          type="email"
          className="w-full rounded border px-3 py-2"
        />
        <input
          {...register("password", { required: true, minLength: 6 })}
          placeholder="Password"
          type="password"
          className="w-full rounded border px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-3 py-2 text-white"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900">
          Login
        </Link>
      </p>
    </div>
  );
}
