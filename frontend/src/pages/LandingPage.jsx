import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function LogoMark({ className = "h-8 w-8" }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 ${className}`}>
      <svg
        className="h-4 w-4 text-white md:h-5 md:w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </span>
  );
}

const FEATURES = [
  {
    title: "Nutrition tracking",
    body: "Log meals, macros, and calories with a clear daily view of what fuels your body.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Water intake",
    body: "Stay hydrated with quick-add presets and a simple progress bar toward your goal.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.25c.53 0 1.04.21 1.41.59l.09.09c.85.85 2.24 2.56 3.31 4.69 1.02 2.03 1.45 4.13.81 5.77-.48 1.2-1.45 2.08-2.87 2.44V20a2.25 2.25 0 01-4.5 0v-4.17c-1.42-.36-2.39-1.24-2.87-2.44-.64-1.64-.21-3.74.81-5.77 1.07-2.13 2.46-3.84 3.31-4.69l.09-.09A2 2 0 0112 2.25z"
      />
    ),
  },
  {
    title: "Fitness logging",
    body: "Record workouts, duration, and calories burned—then see your week at a glance.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75v-6z"
      />
    ),
  },
  {
    title: "Health monitoring",
    body: "Track weight, vitals, and other metrics over time with easy-to-read charts.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    ),
  },
  {
    title: "Goal setting",
    body: "Define calorie, water, and activity targets—and mark wins as you achieve them.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.364 0l2.77.693M21 21v-1.5m0-15.75V9m0 0l-2.77-.693a9 9 0 00-6.364 0L3 9m18 0v6"
      />
    ),
  },
  {
    title: "Reports & trends",
    body: "Daily, weekly, and monthly views help you spot patterns and stay consistent.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9.75M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
      />
    ),
  },
];

const STEPS = [
  {
    n: 1,
    title: "Create your free account",
    body: "Join VitaTrack in seconds with your email.",
  },
  {
    n: 2,
    title: "Set your health goals",
    body: "Tell us your targets and we'll help you get there.",
  },
  {
    n: 3,
    title: "Track daily and watch trends",
    body: "Log metrics daily to see powerful insights grow.",
  },
];

export default function LandingPage() {
  const token = useAuthStore((s) => s.token);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const navLinkClass =
    "text-sm font-medium text-slate-600 transition hover:text-emerald-800";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileNavOpen(false)}>
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              VitaTrack
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <button type="button" className={navLinkClass} onClick={() => scrollToId("features")}>
              Features
            </button>
            <button type="button" className={navLinkClass} onClick={() => scrollToId("how-it-works")}>
              How it Works
            </button>
            <button type="button" className={navLinkClass} onClick={() => scrollToId("pricing")}>
              Pricing
            </button>
            <button type="button" className={navLinkClass} onClick={() => scrollToId("reviews")}>
              Reviews
            </button>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              Login
            </Link>
            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-label="Toggle menu"
              className="rounded-lg border border-slate-200 p-2 text-slate-700"
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {mobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              <button type="button" className={`${navLinkClass} text-left`} onClick={() => { scrollToId("features"); setMobileNavOpen(false); }}>
                Features
              </button>
              <button type="button" className={`${navLinkClass} text-left`} onClick={() => { scrollToId("how-it-works"); setMobileNavOpen(false); }}>
                How it Works
              </button>
              <button type="button" className={`${navLinkClass} text-left`} onClick={() => { scrollToId("pricing"); setMobileNavOpen(false); }}>
                Pricing
              </button>
              <button type="button" className={`${navLinkClass} text-left`} onClick={() => { scrollToId("reviews"); setMobileNavOpen(false); }}>
                Reviews
              </button>
              <Link
                to="/register"
                className="mt-2 rounded-lg bg-emerald-800 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-12 text-center md:px-6 md:pb-24 md:pt-16">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Track your health.{" "}
            <span className="text-emerald-800">Reach your goals.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            VitaTrack brings nutrition, fitness, health metrics, and goals into one calm
            dashboard—so you can build habits that last, one day at a time.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-lg bg-emerald-800 px-8 py-3.5 text-center text-sm font-semibold text-white shadow-md transition hover:bg-emerald-900 sm:w-auto"
            >
              Get started free
            </Link>
            <button
              type="button"
              onClick={() => scrollToId("how-it-works")}
              className="w-full rounded-lg border border-slate-300 bg-white px-8 py-3.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
            >
              See how it works
            </button>
          </div>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <div className="flex -space-x-2">
              {["bg-emerald-200", "bg-sky-200", "bg-amber-200"].map((bg, i) => (
                <div
                  key={i}
                  className={`h-10 w-10 rounded-full border-2 border-white ${bg} ring-1 ring-slate-100`}
                  aria-hidden
                />
              ))}
            </div>
            <p className="text-sm text-slate-500">
              Trusted by 10,000+ users · Free to start
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-slate-900 py-12 text-white md:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 md:grid-cols-4 md:gap-6 md:px-6">
            {[
              { n: "10,000+", l: "Users" },
              { n: "500K+", l: "Meals logged" },
              { n: "200K+", l: "Workouts" },
              { n: "98%", l: "User satisfaction" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-3xl font-bold tabular-nums md:text-4xl">{s.n}</p>
                <p className="mt-2 text-sm text-slate-400 md:text-base">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 bg-emerald-50/80 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Everything you{" "}
              <span className="relative inline-block">
                need
                <span className="absolute -bottom-1 left-0 right-0 mx-auto h-1 w-[85%] rounded-full bg-emerald-600" aria-hidden />
              </span>{" "}
              to stay on track
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-emerald-100/80 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Get started in 3 simple steps
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-10 md:gap-8 lg:grid-cols-3">
              {STEPS.map((step, idx) => (
                <div
                  key={step.n}
                  className={[
                    "flex flex-col items-center text-center",
                    idx < STEPS.length - 1
                      ? "border-b border-dashed border-slate-200 pb-10 lg:border-b-0 lg:pb-0"
                      : "",
                    idx < STEPS.length - 1 && idx < 2
                      ? "lg:border-r lg:border-dashed lg:border-slate-200 lg:pr-10"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-800 text-xl font-bold text-white shadow-lg">
                    {step.n}
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 border-y border-slate-100 bg-slate-50/50 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Simple pricing</h2>
            <p className="mt-3 text-slate-600">Start free. Upgrade when you need more.</p>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Free</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">$0</p>
              <p className="mt-2 text-sm text-slate-600">Core tracking for individuals</p>
              <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span> Nutrition & water logs
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span> Fitness & health metrics
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span> Goals & reports
                </li>
              </ul>
              <Link
                to="/register"
                className="mt-8 inline-flex w-full justify-center rounded-lg bg-emerald-800 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="scroll-mt-24 bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
              Loved by people building better habits
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { q: "Finally one place for food, water, and workouts.", a: "Priya S." },
                { q: "Charts make it easy to show my doctor my progress.", a: "James L." },
                { q: "Goals keep me accountable without feeling overwhelming.", a: "Maria G." },
              ].map((t) => (
                <blockquote
                  key={t.a}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-800">“{t.q}”</p>
                  <footer className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.a}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-12 text-center shadow-sm md:px-12 md:py-16">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Start your health journey today
            </h2>
            <p className="mt-3 text-slate-600">Free forever. No credit card required.</p>
            <Link
              to="/register"
              className="mt-8 inline-flex rounded-lg bg-emerald-800 px-10 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-900"
            >
              Sign up free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <div>
              <div className="flex items-center gap-2">
                <LogoMark className="h-9 w-9" />
                <span className="text-lg font-bold text-white">VitaTrack</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Clinical-style health tracking for real life—nutrition, movement, vitals,
                and goals in one place.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/dashboard" className="transition hover:text-white">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/nutrition" className="transition hover:text-white">
                    Nutrition
                  </Link>
                </li>
                <li>
                  <Link to="/fitness" className="transition hover:text-white">
                    Fitness
                  </Link>
                </li>
                <li>
                  <Link to="/goals" className="transition hover:text-white">
                    Goals
                  </Link>
                </li>
                <li>
                  <Link to="/reports" className="transition hover:text-white">
                    Reports
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Support</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/login" className="transition hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition hover:text-white">
                    Sign up
                  </Link>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} VitaTrack. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-500 transition hover:text-white" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-slate-500 transition hover:text-white" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
