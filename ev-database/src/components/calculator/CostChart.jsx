import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'

const COLOR_A = '#2563eb'
const COLOR_B = '#dc2626'

const formatEur = (v) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

// Custom tooltip styled to match the app's card aesthetic
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      fontSize: 13,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontWeight: 700, color: '#555', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label !== undefined ? (typeof label === 'number' ? `Jahr ${label}` : label) : ''}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#333', flex: 1 }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{formatEur(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function TotalCostChart({ seriesA, seriesB, labelA, labelB, breakevenYear }) {
  const data = seriesA.map((a, i) => ({
    year: a.year,
    [labelA]: Math.round(a.gesamt),
    [labelB]: Math.round(seriesB[i].gesamt),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          label={{ value: 'Jahre', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#888' }}
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={{ stroke: '#e0e0e0' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${Math.round(v / 1000)}k€`}
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif', paddingTop: 8 }}
        />
        {breakevenYear && (
          <ReferenceLine
            x={breakevenYear}
            stroke="#16a34a"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Break-even', fill: '#16a34a', fontSize: 11, fontWeight: 600 }}
          />
        )}
        <Line type="monotone" dataKey={labelA} stroke={COLOR_A} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey={labelB} stroke={COLOR_B} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MonthlyCostChart({ tcoA, tcoB, labelA, labelB, years }) {
  const categories = ['kaufpreis', 'energie', 'wartung', 'versicherung', 'steuer', 'finanzierung']
  const months = years * 12

  const data = categories.map(key => ({
    name: key,
    [labelA]: Math.round((tcoA[key] || 0) / months),
    [labelB]: Math.round((tcoB[key] || 0) / months),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          angle={-30}
          textAnchor="end"
          interval={0}
          tick={{ fontSize: 11, fill: '#666' }}
          axisLine={{ stroke: '#e0e0e0' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}€`}
          tick={{ fontSize: 12, fill: '#666' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: 'system-ui, -apple-system, sans-serif', paddingTop: 8 }}
        />
        <Bar dataKey={labelA} fill={COLOR_A} radius={[3, 3, 0, 0]} />
        <Bar dataKey={labelB} fill={COLOR_B} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
