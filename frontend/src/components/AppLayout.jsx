import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const desktopSections = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/nutrition", label: "Nutrition" },
      { to: "/health", label: "Health" },
      { to: "/goals", label: "Goals" },
      { to: "/reports", label: "Reports" },
    ],
  },
  {
    title: "Exercise",
    items: [
      { to: "/fitness", label: "Fitness" },
      { to: "/exercises", label: "Exercises" },
      { to: "/videos", label: "Videos" },
    ],
  },
  {
    title: "Account",
    items: [{ to: "/profile", label: "Profile" }],
  },
];

const mobileNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/fitness", label: "Fitness" },
  { to: "/exercises", label: "Exercises" },
  { to: "/videos", label: "Videos" },
  { to: "/profile", label: "Profile" },
];

function navClass({ isActive }) {
  return [
    "rounded-md px-3 py-2 text-sm transition",
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

export default function AppLayout() {
  const clearToken = useAuthStore((state) => state.clearToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r bg-white p-4 md:flex md:flex-col">
          <h1 className="mb-6 text-xl font-bold text-slate-900">VitaTrack</h1>
          <nav className="flex flex-1 flex-col gap-5">
            {desktopSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {section.title}
                </p>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b bg-white p-4 md:hidden">
            <h1 className="text-lg font-semibold text-slate-900">VitaTrack</h1>
          </header>

          <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t bg-white md:hidden">
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "min-w-[90px] rounded px-2 py-2 text-center text-xs",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded px-2 py-2 text-center text-xs text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
