import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

// Generic polished time-series line chart
// Expects each datum to have: { ts: number(ms since epoch), value: number }
const Chart = ({ data, title, dataKey = 'value', color = '#8884d8', height = 360, syncId }) => {
  const formatTick = (v) => {
    try { return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return v; }
  };
  const formatLabel = (v) => {
    try { return new Date(v).toLocaleString(); } catch { return v; }
  };

  return (
    <div className="chart-container">
      {title && <h3>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} syncId={syncId}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickFormatter={formatTick} />
          <YAxis width={52} tickLine={false} />
          <Tooltip labelFormatter={formatLabel} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
          <Brush height={14} travellerWidth={8} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
