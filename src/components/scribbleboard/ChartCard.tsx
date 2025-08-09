import React, { useRef, useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { Maximize2, RotateCcw, Layers, TrendingUp, BarChart3 } from 'lucide-react';

export type ChartSeriesPoint = { x: number|string; y: number; z?: number };
export type ChartSeries = { name: string; data: ChartSeriesPoint[]; color?: string };

// 3D Chart scenarios for different use cases
const CHART_SCENARIOS = {
  education: {
    name: 'Education Analytics',
    description: 'Student performance and learning progress tracking',
    sampleData: [
      { subject: 'Math', score: 85, engagement: 90, difficulty: 7 },
      { subject: 'Science', score: 78, engagement: 85, difficulty: 8 },
      { subject: 'English', score: 92, engagement: 75, difficulty: 6 },
      { subject: 'History', score: 88, engagement: 70, difficulty: 5 },
      { subject: 'Art', score: 95, engagement: 95, difficulty: 4 }
    ],
    axes: { x: 'Subject', y: 'Score', z: 'Engagement', color: 'Difficulty' }
  },
  budget: {
    name: 'Budget Analysis',
    description: 'Financial planning and expense tracking',
    sampleData: [
      { category: 'Marketing', planned: 15000, actual: 12500, efficiency: 83 },
      { category: 'Operations', planned: 25000, actual: 27800, efficiency: 90 },
      { category: 'R&D', planned: 20000, actual: 18900, efficiency: 95 },
      { category: 'HR', planned: 12000, actual: 11200, efficiency: 93 },
      { category: 'IT', planned: 18000, actual: 19500, efficiency: 87 }
    ],
    axes: { x: 'Category', y: 'Planned Budget', z: 'Actual Spend', color: 'Efficiency' }
  },
  projectPlan: {
    name: 'Project Timeline',
    description: 'Project milestones and resource allocation',
    sampleData: [
      { phase: 'Planning', duration: 4, resources: 8, completion: 100 },
      { phase: 'Design', duration: 6, resources: 12, completion: 85 },
      { phase: 'Development', duration: 12, resources: 20, completion: 60 },
      { phase: 'Testing', duration: 4, resources: 8, completion: 30 },
      { phase: 'Deployment', duration: 2, resources: 6, completion: 0 }
    ],
    axes: { x: 'Phase', y: 'Duration (weeks)', z: 'Resources', color: 'Completion %' }
  },
  performance: {
    name: 'Performance Metrics',
    description: 'KPI tracking and performance analysis',
    sampleData: [
      { metric: 'Efficiency', current: 87, target: 90, trend: 5 },
      { metric: 'Quality', current: 94, target: 95, trend: 2 },
      { metric: 'Speed', current: 78, target: 85, trend: 8 },
      { metric: 'Satisfaction', current: 92, target: 90, trend: -1 },
      { metric: 'Innovation', current: 85, target: 88, trend: 6 }
    ],
    axes: { x: 'Metric', y: 'Current Value', z: 'Target', color: 'Trend' }
  }
};

interface ChartCardProps {
  title?: string;
  type?: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'scatter3d' | '3d-plotly' | '3d-scenario' | 'image';
  series: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
  compact?: boolean;
  scenario?: keyof typeof CHART_SCENARIOS;
  interactive?: boolean;
  imageUrl?: string;
  metadata?: any;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type='line', series, xLabel, yLabel, compact, scenario, interactive = true, imageUrl, metadata }) => {
  const height = compact ? 180 : 260;
  const chartRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentView, setCurrentView] = useState<'2d' | '3d'>('2d');
  
  // Get scenario data if specified
  const scenarioData = scenario ? CHART_SCENARIOS[scenario] : null;
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
      case 'scatter3d':
      case '3d-plotly': {
        // Enhanced 3D visualization with Plotly
        const s = series[0] || { name: 'Data', data: [] };
        const xs = s.data.map(d => (typeof d.x === 'string' ? 0 : d.x as number));
        const ys = s.data.map(d => d.y);
        const zs = s.data.map(d => (d.z ?? Math.random() * 100));
        
        const plotlyConfig = {
          data: [{
            x: xs,
            y: ys,
            z: zs,
            mode: 'markers+lines',
            type: 'scatter3d',
            marker: {
              size: compact ? 4 : 6,
              color: zs,
              colorscale: 'Viridis',
              showscale: true,
              colorbar: { title: 'Value', len: 0.8 }
            },
            line: { color: '#2563eb', width: 2 }
          }],
          layout: {
            scene: {
              xaxis: { title: xLabel || 'X Axis' },
              yaxis: { title: yLabel || 'Y Axis' },
              zaxis: { title: 'Z Axis' },
              camera: {
                eye: { x: 1.2, y: 1.2, z: 0.6 }
              }
            },
            margin: { l: 0, r: 0, b: 0, t: 20 },
            showlegend: false
          },
          config: {
            displayModeBar: !compact,
            responsive: true,
            displaylogo: false
          }
        };
        
        const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <meta name='viewport' content='width=device-width,initial-scale=1'/>
  <script src='https://cdn.plot.ly/plotly-2.30.0.min.js'></script>
  <style>
    html,body,#root{height:100%;margin:0;font-family:system-ui,sans-serif}
    .controls{position:absolute;top:10px;right:10px;z-index:1000;display:flex;gap:5px}
    .btn{padding:5px 8px;background:rgba(255,255,255,0.9);border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:11px}
    .btn:hover{background:rgba(255,255,255,1)}
  </style>
</head>
<body>
  <div class='controls'>
    <button class='btn' onclick='resetView()'>Reset View</button>
    <button class='btn' onclick='autoRotate()'>Auto Rotate</button>
  </div>
  <div id='root'></div>
  <script>
    const data = ${JSON.stringify(plotlyConfig.data)};
    const layout = ${JSON.stringify(plotlyConfig.layout)};
    const config = ${JSON.stringify(plotlyConfig.config)};
    
    Plotly.newPlot('root', data, layout, config);
    
    let rotating = false;
    function autoRotate() {
      if (rotating) return;
      rotating = true;
      let angle = 0;
      const interval = setInterval(() => {
        angle += 2;
        const eye = {
          x: 1.2 * Math.cos(angle * Math.PI / 180),
          y: 1.2 * Math.sin(angle * Math.PI / 180),
          z: 0.6
        };
        Plotly.relayout('root', {'scene.camera.eye': eye});
        if (angle >= 360) {
          clearInterval(interval);
          rotating = false;
        }
      }, 50);
    }
    
    function resetView() {
      Plotly.relayout('root', {'scene.camera.eye': {x: 1.2, y: 1.2, z: 0.6}});
    }
  </script>
</body>
</html>`;
        
        return (
          <div className="w-full h-full relative">
            <iframe 
              title={title || '3D Interactive Chart'} 
              srcDoc={doc} 
              style={{ width: '100%', height, border: 'none', borderRadius: 8 }} 
              className="bg-gray-50"
            />
          </div>
        );
      }
      case '3d-scenario': {
        if (!scenarioData) return null;
        
        // Create 3D scenario visualization
        const data = scenarioData.sampleData;
        const axes = scenarioData.axes;
        
        const plotlyData = [{
          x: data.map(d => d[Object.keys(d)[0]]),
          y: data.map(d => d[Object.keys(d)[1]]),
          z: data.map(d => d[Object.keys(d)[2]]),
          mode: 'markers+text',
          type: 'scatter3d',
          text: data.map(d => d[Object.keys(d)[0]]),
          textposition: 'top center',
          marker: {
            size: data.map(d => d[Object.keys(d)[3]] ? d[Object.keys(d)[3]] / 10 : 8),
            color: data.map(d => d[Object.keys(d)[3]] || 50),
            colorscale: 'RdYlBu',
            showscale: true,
            colorbar: { title: axes.color, len: 0.8 }
          }
        }];
        
        const layout = {
          title: scenarioData.name,
          scene: {
            xaxis: { title: axes.x },
            yaxis: { title: axes.y },
            zaxis: { title: axes.z },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
          },
          margin: { l: 0, r: 0, b: 0, t: 30 }
        };
        
        const doc = `<!DOCTYPE html>
<html>
<head>
  <script src='https://cdn.plot.ly/plotly-2.30.0.min.js'></script>
  <style>html,body,#root{height:100%;margin:0;font-family:system-ui}</style>
</head>
<body>
  <div id='root'></div>
  <script>
    const data = ${JSON.stringify(plotlyData)};
    const layout = ${JSON.stringify(layout)};
    Plotly.newPlot('root', data, layout, {displayModeBar: true, responsive: true});
  </script>
</body>
</html>`;
        
        return (
          <div className="w-full h-full">
            <iframe 
              title={scenarioData.name} 
              srcDoc={doc} 
              style={{ width: '100%', height, border: 'none', borderRadius: 8 }} 
            />
          </div>
        );
      }
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={title || 'Visual Content'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                style={{ maxHeight: height - 20 }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <div>Image not available</div>
              </div>
            )}
          </div>
        );
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
    <div className={`${compact ? 'p-2 rounded-md' : 'p-4 rounded-lg'} border bg-white/80 dark:bg-black/40 border-black/10 dark:border-white/10 relative group`}>
      {/* Enhanced header with scenario info and controls */}
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
        <div>
          {title && (
            <div className={`font-medium ${compact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
              {type?.includes('3d') ? (
                <Layers className="w-4 h-4 text-blue-600" />
              ) : (
                <BarChart3 className="w-4 h-4 text-blue-600" />
              )}
              {title}
            </div>
          )}
          {scenarioData && (
            <div className="text-xs text-gray-600 mt-1">
              {scenarioData.description}
            </div>
          )}
        </div>
        
        {/* Chart controls */}
        {!compact && interactive && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {type?.includes('3d') && (
              <button
                onClick={() => setCurrentView(currentView === '2d' ? '3d' : '2d')}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={`Switch to ${currentView === '2d' ? '3D' : '2D'} view`}
              >
                <TrendingUp className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      
      {/* Chart content */}
      <div ref={chartRef} style={{ width: '100%', height }}>
        {type?.includes('3d') || type === '3d-scenario' ? (
          renderChart()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Scenario data summary */}
      {scenarioData && !compact && (
        <div className="mt-2 pt-2 border-t border-gray-200/50">
          <div className="text-xs text-gray-500">
            📊 {scenarioData.sampleData.length} data points • 
            🎯 {scenarioData.axes.x} vs {scenarioData.axes.y}
            {scenarioData.axes.z && ` vs ${scenarioData.axes.z}`}
          </div>
        </div>
      )}
      
      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                {scenarioData && (
                  <p className="text-sm text-gray-600">{scenarioData.description}</p>
                )}
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-[calc(100%-5rem)]">
              <div style={{ width: '100%', height: '100%' }}>
                {type?.includes('3d') || type === '3d-scenario' ? (
                  renderChart()
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCard;
export { CHART_SCENARIOS };

