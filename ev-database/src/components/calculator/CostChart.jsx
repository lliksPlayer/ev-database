import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'

const COLOR_A = '#0ea5e9'
const COLOR_B = '#f97316'
const GRID_COLOR = '#e2e8f0'
const AXIS_COLOR = '#64748b'
const TEXT_COLOR = '#0f172a'
const BODY_FONT = "'Plus Jakarta Sans', system-ui, sans-serif"
const HEADING_FONT = "'Outfit', system-ui, sans-serif"

const formatEur = (v) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

const formatAxisThousands = (value) => `${Math.round(value / 1000)}k €`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.98)',
      border: '1px solid rgba(203, 213, 225, 0.9)',
      borderRadius: 18,
      padding: '12px 14px',
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
      fontSize: 13,
      fontFamily: BODY_FONT,
      minWidth: 180,
    }}>
      <div style={{
        fontWeight: 700,
        color: AXIS_COLOR,
        marginBottom: 8,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label !== undefined ? (typeof label === 'number' ? `Jahr ${label}` : label) : ''}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: entry.color,
            display: 'inline-block',
            flexShrink: 0,
            boxShadow: `0 0 0 4px ${entry.color}22`,
          }} />
          <span style={{ color: TEXT_COLOR, flex: 1 }}>{entry.name}</span>
          <span style={{ fontWeight: 700, color: TEXT_COLOR, fontFamily: HEADING_FONT }}>{formatEur(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

const ChartLegend = ({ payload }) => {
  if (!payload?.length) return null

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      paddingTop: 6,
    }}>
      {payload.map((entry) => (
        <div
          key={entry.value}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 999,
            background: '#f8fafc',
            border: '1px solid rgba(203, 213, 225, 0.8)',
            color: TEXT_COLOR,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: BODY_FONT,
          }}
        >
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: entry.color,
            display: 'inline-block',
            boxShadow: `0 0 0 4px ${entry.color}22`,
          }} />
          {entry.value}
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
      <LineChart data={data} margin={{ top: 14, right: 20, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 8" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="year"
          label={{ value: 'Jahre', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: AXIS_COLOR, fontFamily: BODY_FONT }}
          tick={{ fontSize: 12, fill: AXIS_COLOR, fontFamily: BODY_FONT }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          tickFormatter={formatAxisThousands}
          tick={{ fontSize: 12, fill: AXIS_COLOR, fontFamily: BODY_FONT }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<ChartLegend />} />
        {breakevenYear && (
          <ReferenceLine
            x={breakevenYear}
            stroke="#16a34a"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Break-even', fill: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: BODY_FONT }}
          />
        )}
        <Line
          type="monotone"
          dataKey={labelA}
          stroke={COLOR_A}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: COLOR_A, stroke: '#ffffff', strokeWidth: 3 }}
        />
        <Line
          type="monotone"
          dataKey={labelB}
          stroke={COLOR_B}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: COLOR_B, stroke: '#ffffff', strokeWidth: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MonthlyCostChart({ data, labelA, labelB }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 14, right: 20, left: 4, bottom: 20 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="2 8" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="name"
          angle={-18}
          textAnchor="end"
          interval={0}
          height={60}
          tick={{ fontSize: 11, fill: AXIS_COLOR, fontFamily: BODY_FONT }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          tickFormatter={formatEur}
          tick={{ fontSize: 12, fill: AXIS_COLOR, fontFamily: BODY_FONT }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<ChartLegend />} />
        <Bar dataKey={labelA} fill={COLOR_A} radius={[10, 10, 0, 0]} maxBarSize={22} />
        <Bar dataKey={labelB} fill={COLOR_B} radius={[10, 10, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
