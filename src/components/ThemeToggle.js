// src/components/ThemeToggle.js
import { useEffect, useState } from 'react';

export default function ThemeToggle(){
  const [theme, setTheme] = useState(() => localStorage.getItem('aq-theme') || 'industrial');

  useEffect(()=>{
    // analytics page will set data-theme="cyber" on html when opened
    if(theme === 'cyber') document.documentElement.setAttribute('data-theme','cyber');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('aq-theme', theme);
  },[theme]);

  return (
    <div style={{display:'flex', gap:8}}>
      <button className="btn" onClick={()=>setTheme('industrial')}>Industrial</button>
      <button className="btn" onClick={()=>setTheme('cyber')}>Cyber</button>
    </div>
  );
}
