import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tables', label: 'Tables' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
      <nav aria-label="Main" className="flex gap-4 bg-slate-900 px-6 py-3 text-white">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) =>
              isActive ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto max-w-4xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
