import { useState } from 'react';
import aboutText from '@/assets/about.txt?raw';
import dotInline from '@/assets/dot.svg?inline';
import Logo from '@/assets/logo.svg';
import patternUrl from '@/assets/pattern.svg?url';

export default function Settings() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <section>
      <h1>Settings</h1>
      <p className="mt-4 text-sm text-slate-500">
        {process.env.APP_NAME} · version: {__APP_VERSION__} · api: {process.env.API_URL}
      </p>
      <button type="button" onClick={toggle}>
        {dark ? 'Switch to light' : 'Switch to dark'}
      </button>
      <h2 className="mt-6 text-lg font-semibold">Assets</h2>
      <div className="flex items-center gap-4">
        <Logo aria-label="logo" className="h-6 w-6 text-indigo-600" />
        <img src={patternUrl} alt="pattern (asset/resource)" width={40} height={40} />
        <img src={dotInline} alt="dot (asset/inline)" width={8} height={8} />
      </div>
      <pre className="mt-2 text-sm">{aboutText}</pre>
    </section>
  );
}
