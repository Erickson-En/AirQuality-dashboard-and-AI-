// src/pages/Settings.js
import React, { useEffect, useState } from 'react';
import { api } from '../config/api';

const defaults = { pm25:150, pm10:150, co:10, o3:100, no2:100 };

export default function Settings(){
  const [thresholds, setThresholds] = useState(defaults);
  const userId = 'admin';

  useEffect(()=>{
    (async()=>{
      try{
        const { data } = await api.get(`/api/settings/${userId}`);
        if(data?.thresholds) setThresholds(data.thresholds);
      }catch(e){}
    })();
  },[]);

  const save = async () => {
    await api.post('/api/settings', { userId, thresholds });
    alert('Saved');
  };

  return (
    <div>
      <h2>Settings - Custom alerts</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12}}>
        {Object.keys(thresholds).map(k=>(
          <div key={k} style={{background:'var(--card-bg)', padding:12, borderRadius:10}}>
            <label style={{display:'block', marginBottom:8}}>{k.toUpperCase()}</label>
            <input type="number" value={thresholds[k]} onChange={e=>setThresholds(s=>({...s,[k]:Number(e.target.value)}))} />
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <button className="btn primary" onClick={save}>Save Settings</button>
      </div>
    </div>
  );
}
