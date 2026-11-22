const stats = [
  { label: 'Users', value: '1,280' },
  { label: 'Revenue', value: '$48,200' },
  { label: 'Orders', value: '342' },
];

export default function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <dl className="mt-4 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-4 shadow dark:bg-slate-800">
            <dt className="text-sm text-slate-500">{s.label}</dt>
            <dd className="text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
