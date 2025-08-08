import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';

export type ChartSeriesPoint = { x: number|string; y: number };
export type ChartSeries = { name: string; data: ChartSeriesPoint[]; color?: string };

interface ChartCardProps {
  title?: string;
  type?: 'line' | 'area' | 'bar' | 'scatter' | 'pie';
  series: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
  compact?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type='line', series, xLabel, yLabel, compact }) => {
  const height = compact ? 180 : 260;
  const data = React.useMemo(() => {
    // Merge series into a single array of points keyed by x
    const map = new Map<string|number, any>();
    series.forEach(s => {
      s.data.forEach(p => {
        const key = p.x;
        if (!map.has(key)) map.set(key, { x: key });
        map.get(key)[s.name] = p.y;
      });
    });
    return Array.from(map.values()).sort((a,b)=> (a.x>b.x?1:-1));
  }, [series]);

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2 } : undefined} />
            <YAxis label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            <Legend />
            {series.map((s, i) => (
              <Area key={s.name} type="monotone" dataKey={s.name} stroke={s.color || '#2563eb'} fill={s.color || '#93c5fd'} />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2 } : undefined} />
            <YAxis label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            <Legend />
            {series.map((s) => (
              <Bar key={s.name} dataKey={s.name} fill={s.color || '#2563eb'} />
            ))}
          </BarChart>
        );
      case 'scatter': {
        // Use first series for scatter points; additional series can be layered
        return (
          <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="x" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2 } : undefined} />
            <YAxis type="number" dataKey="y" name="y" label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {series.map((s) => (
              <Scatter key={s.name} name={s.name} data={s.data} fill={s.color || '#2563eb'} />
            ))}
          </ScatterChart>
        );
      }
      case 'pie': {
        // Interpret first series' data as pie slices
        const s = series[0] || { name: 'Data', data: [] };
        const colors = ['#2563eb','#dc2626','#16a34a','#f59e0b','#9333ea','#06b6d4','#f97316'];
        return (
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={s.data.map((p)=>({ name: String(p.x), value: p.y }))} dataKey="value" nameKey="name" outerRadius={Math.min(100, Math.floor(height/2))}>
              {s.data.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      }
      default:
        return (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2 } : undefined} />
            <YAxis label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            <Legend />
            {series.map((s) => (
              <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color || '#2563eb'} dot={false} />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className={`${compact ? 'p-2 rounded-md' : 'p-4 rounded-lg'} border bg-white/80 dark:bg-black/40 border-black/10 dark:border-white/10`}>
      {title && <div className={`font-medium ${compact ? 'mb-2 text-sm' : 'mb-3'}`}>{title}</div>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;

