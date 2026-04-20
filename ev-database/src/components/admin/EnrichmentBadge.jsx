import './EnrichmentBadge.css'

const SOURCE_LABELS = {
  'ev-database.org': 'EV-DB',
  'manufacturer': 'Hersteller',
  'claude': 'KI',
}

export default function EnrichmentBadge({ meta }) {
  if (!meta) return null

  const isLow = meta.confidence === 'low'
  const label = SOURCE_LABELS[meta.source] ?? meta.source
  const actionLabel = meta.action === 'corrected' ? 'Korrigiert' : 'Ergänzt'
  const tooltip = `${actionLabel} · ${meta.source} · ${meta.at}`

  return (
    <span
      className={`enrichment-badge${isLow ? ' enrichment-badge--low' : ''}`}
      title={tooltip}
    >
      {isLow ? '⚠' : '↺'} {label}
    </span>
  )
}
