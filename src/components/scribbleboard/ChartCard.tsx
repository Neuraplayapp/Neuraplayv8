import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';

export type ChartSeriesPoint = { x: number|string; y: number; z?: number };
export type ChartSeries = { name: string; data: ChartSeriesPoint[]; color?: string };

interface ChartCardProps {
  title?: string;
  type?: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'scatter3d';
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
      case 'scatter3d': {
        // Render a lightweight Plotly 3D scatter via iframe to avoid bundling heavy libs
        const s = series[0] || { name: 'Data', data: [] };
        const xs = s.data.map(d => (typeof d.x === 'string' ? 0 : d.x as number));
        const ys = s.data.map(d => d.y);
        const zs = s.data.map(d => (d.z ?? 0));
        const doc = `<!DOCTYPE html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><script src='https://cdn.plot.ly/plotly-2.30.0.min.js'></script><style>html,body,#root{height:100%;margin:0}</style></head><body><div id='root'></div><script>var data=[{x:${JSON.stringify(xs)},y:${JSON.stringify(ys)},z:${JSON.stringify(zs)},mode:'markers',type:'scatter3d',marker:{size:3,color:'${s.color || '#2563eb'}'}}];var layout={margin:{l:0,r:0,b:0,t:0}};Plotly.newPlot('root',data,layout,{displayModeBar:false});</script></body></html>`;
        return (
          <div className="w-full h-full">
            <iframe title={title || '3D Chart'} srcDoc={doc} style={{ width: '100%', height, border: 'none', borderRadius: 8 }} />
          </div>
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

