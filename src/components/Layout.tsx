import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tables', label: 'Tables' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  return (
    <div>
      <nav aria-label="Main">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
