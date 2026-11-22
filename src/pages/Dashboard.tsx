const stats = [
  { label: 'Users', value: '1,280' },
  { label: 'Revenue', value: '$48,200' },
  { label: 'Orders', value: '342' },
];

export default function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <dl>
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
