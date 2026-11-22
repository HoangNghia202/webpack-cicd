import { useState } from 'react';

export default function Settings() {
  const [dark, setDark] = useState(false);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <section>
      <h1>Settings</h1>
      <button type="button" onClick={toggle}>
        {dark ? 'Switch to light' : 'Switch to dark'}
      </button>
    </section>
  );
}
