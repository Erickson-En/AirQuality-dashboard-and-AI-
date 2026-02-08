// src/components/MetricCard.js
import React, { memo, useMemo } from 'react';

const MetricCard = memo(function MetricCard({ title, value = 0, unit = '', color }) {
  // Compute percent for fill: if value >100 assume mapping required; simple heuristic
  const fillStyle = useMemo(() => {
    let percent = 0;
    if (typeof value === 'number') {
      if (unit && unit.includes('%')) percent = Math.max(0, Math.min(100, value));
      else {
        // heuristics: PM scale to 0-200, temp to 0-100, light to 0-1000
        let max = 200;
        if (/temp/i.test(title)) max = 100;
        if (/light/i.test(title)) max = 1000;
        percent = Math.round(Math.max(0, Math.min(100, (value / max) * 100)));
      }
    }

    const style = { height: `${percent}%` };
    if (color) style.background = color;
    return style;
  }, [value, unit, title, color]);

  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-gauge">
        <div className="metric-fill" style={fillStyle} />
      </div>
      <div className="metric-value">{typeof value === 'number' ? `${value}${unit ? ' ' + unit : ''}` : 'N/A'}</div>
    </div>
  );
});

export default MetricCard;
