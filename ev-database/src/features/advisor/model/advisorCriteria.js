const BOTH_TYPES = Object.freeze(['ev', 'ice'])

export const ADVISOR_DRIVETRAINS = Object.freeze(['all', 'ev', 'ice'])

export const ADVISOR_CRITERIA_GROUPS = Object.freeze([
  {
    id: 'basis',
    criteria: ['basis_preis', 'karosserie', 'segment', 'null_hundert'],
  },
  {
    id: 'praxis',
    criteria: ['kofferraum_l', 'sitze', 'anhaengelast', 'isofix'],
  },
  {
    id: 'technik',
    criteria: ['wltp_reichweite', 'batterie_netto', 'laden_10_80_min', 'waermepumpe', 'verbrauch_l_100km'],
  },
])

export const ADVISOR_CRITERIA = Object.freeze([
  {
    id: 'basis_preis',
    fieldKey: 'basis_preis',
    appliesTo: BOTH_TYPES,
    group: 'basis',
    kind: 'number',
    direction: 'lower-better',
    defaultEnabled: true,
    defaults: { ok: 50000, good: 40000 },
    input: { min: 15000, max: 200000, step: 1000 },
  },
  {
    id: 'null_hundert',
    fieldKey: 'null_hundert',
    appliesTo: BOTH_TYPES,
    group: 'basis',
    kind: 'number',
    direction: 'lower-better',
    defaultEnabled: false,
    defaults: { ok: 8, good: 6 },
    input: { min: 2, max: 20, step: 0.1 },
  },
  {
    id: 'anhaengelast',
    fieldKey: 'anhaengelast',
    appliesTo: BOTH_TYPES,
    group: 'praxis',
    kind: 'number',
    direction: 'higher-better',
    defaultEnabled: false,
    defaults: { ok: 1000, good: 1500 },
    input: { min: 0, max: 3500, step: 50 },
  },
  {
    id: 'karosserie',
    fieldKey: 'karosserie',
    appliesTo: BOTH_TYPES,
    group: 'basis',
    kind: 'select',
    multi: true,
    defaultEnabled: false,
  },
  {
    id: 'segment',
    fieldKey: 'segment',
    appliesTo: BOTH_TYPES,
    group: 'basis',
    kind: 'select',
    multi: true,
    defaultEnabled: false,
  },
  {
    id: 'kofferraum_l',
    fieldKey: 'kofferraum_l',
    appliesTo: BOTH_TYPES,
    group: 'praxis',
    kind: 'number',
    direction: 'higher-better',
    defaultEnabled: false,
    defaults: { ok: 450, good: 600 },
    input: { min: 100, max: 2500, step: 10 },
  },
  {
    id: 'sitze',
    fieldKey: 'sitze',
    appliesTo: BOTH_TYPES,
    group: 'praxis',
    kind: 'number',
    direction: 'higher-better',
    defaultEnabled: false,
    defaults: { ok: 5, good: 7 },
    input: { min: 2, max: 9, step: 1 },
  },
  {
    id: 'isofix',
    fieldKey: 'isofix',
    appliesTo: BOTH_TYPES,
    group: 'praxis',
    kind: 'boolean',
    defaultEnabled: false,
    defaults: { selectedValue: 'yes' },
  },
  {
    id: 'wltp_reichweite',
    fieldKey: 'wltp_reichweite',
    appliesTo: ['ev'],
    group: 'technik',
    kind: 'number',
    direction: 'higher-better',
    defaultEnabled: true,
    defaults: { ok: 400, good: 500 },
    input: { min: 150, max: 900, step: 10 },
  },
  {
    id: 'batterie_netto',
    fieldKey: 'batterie_netto',
    appliesTo: ['ev'],
    group: 'technik',
    kind: 'number',
    direction: 'higher-better',
    defaultEnabled: false,
    defaults: { ok: 75, good: 90 },
    input: { min: 25, max: 150, step: 1 },
  },
  {
    id: 'laden_10_80_min',
    fieldKey: 'laden_10_80_min',
    appliesTo: ['ev'],
    group: 'technik',
    kind: 'number',
    direction: 'lower-better',
    defaultEnabled: true,
    defaults: { ok: 32, good: 24 },
    input: { min: 10, max: 90, step: 1 },
  },
  {
    id: 'waermepumpe',
    fieldKey: 'waermepumpe',
    appliesTo: ['ev'],
    group: 'technik',
    kind: 'boolean',
    defaultEnabled: false,
    defaults: { selectedValue: 'yes' },
  },
  {
    id: 'verbrauch_l_100km',
    fieldKey: 'verbrauch_l_100km',
    appliesTo: ['ice'],
    group: 'technik',
    kind: 'number',
    direction: 'lower-better',
    defaultEnabled: true,
    defaults: { ok: 6.5, good: 5.5 },
    input: { min: 3, max: 15, step: 0.1 },
  },
])

function appliesToDrivetrain(criterion, drivetrain) {
  if (drivetrain === 'all') {
    return criterion.appliesTo.length === BOTH_TYPES.length
  }

  return criterion.appliesTo.includes(drivetrain)
}

function getNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeOptionValue(value) {
  return String(value ?? '').trim()
}

function normalizeBooleanLike(value) {
  const normalized = normalizeOptionValue(value).toLowerCase()
  if (!normalized) return ''
  if (['yes', 'ja', 'true', '1'].includes(normalized)) return 'yes'
  if (['no', 'nein', 'false', '0'].includes(normalized)) return 'no'
  return normalized
}

function normalizeOptionList(values = []) {
  return [...new Set(
    values
      .map((value) => normalizeOptionValue(value))
      .filter(Boolean)
  )]
}

export function createAdvisorCriteriaState() {
  return Object.fromEntries(
    ADVISOR_CRITERIA.map((criterion) => [
      criterion.id,
      {
        enabled: criterion.defaultEnabled,
        good: criterion.defaults?.good ?? null,
        ok: criterion.defaults?.ok ?? null,
        selectedValue: criterion.defaults?.selectedValue ?? '',
        selectedValues: normalizeOptionList(criterion.defaults?.selectedValues ?? []),
      },
    ])
  )
}

export function cloneAdvisorCriteriaState(state = {}) {
  return Object.fromEntries(
    Object.entries(state).map(([criterionId, criterionState]) => [
      criterionId,
      {
        enabled: Boolean(criterionState?.enabled),
        good: criterionState?.good ?? null,
        ok: criterionState?.ok ?? null,
        selectedValue: criterionState?.selectedValue ?? '',
        selectedValues: normalizeOptionList(criterionState?.selectedValues ?? []),
      },
    ])
  )
}

export function getAdvisorCriteriaForDrivetrain(drivetrain = 'all') {
  return ADVISOR_CRITERIA.filter((criterion) => appliesToDrivetrain(criterion, drivetrain))
}

export function getCriterionThresholds(criterion, criterionState) {
  if (criterion.kind !== 'number') return null

  const rawGood = getNumber(criterionState?.good)
  const rawOk = getNumber(criterionState?.ok)

  if (rawGood === null || rawOk === null) return null

  if (criterion.direction === 'higher-better') {
    const good = Math.max(rawGood, rawOk)
    const ok = Math.min(rawGood, rawOk)
    return {
      good,
      ok,
      weakLimit: ok * 0.85,
    }
  }

  const good = Math.min(rawGood, rawOk)
  const ok = Math.max(rawGood, rawOk)

  return {
    good,
    ok,
    weakLimit: ok * 1.15,
  }
}

function evaluateNumberCriterion(vehicleValue, criterion, criterionState) {
  const thresholds = getCriterionThresholds(criterion, criterionState)
  if (!thresholds) {
    return { status: 'inactive', score: 0, excluded: false, comparable: false }
  }

  const numericValue = getNumber(vehicleValue)
  if (numericValue === null) {
    return {
      status: 'missing',
      score: 0,
      excluded: false,
      comparable: false,
      value: null,
      thresholds,
    }
  }

  if (criterion.direction === 'higher-better') {
    if (numericValue >= thresholds.good) {
      return { status: 'good', score: 2, excluded: false, comparable: true, value: numericValue, thresholds }
    }

    if (numericValue >= thresholds.ok) {
      return { status: 'ok', score: 1, excluded: false, comparable: true, value: numericValue, thresholds }
    }

    if (numericValue >= thresholds.weakLimit) {
      return { status: 'weak', score: -1, excluded: false, comparable: true, value: numericValue, thresholds }
    }

    return { status: 'insufficient', score: -2, excluded: true, comparable: true, value: numericValue, thresholds }
  }

  if (numericValue <= thresholds.good) {
    return { status: 'good', score: 2, excluded: false, comparable: true, value: numericValue, thresholds }
  }

  if (numericValue <= thresholds.ok) {
    return { status: 'ok', score: 1, excluded: false, comparable: true, value: numericValue, thresholds }
  }

  if (numericValue <= thresholds.weakLimit) {
    return { status: 'weak', score: -1, excluded: false, comparable: true, value: numericValue, thresholds }
  }

  return { status: 'insufficient', score: -2, excluded: true, comparable: true, value: numericValue, thresholds }
}

function evaluateSelectCriterion(vehicleValue, criterion, criterionState) {
  const selectedValues = normalizeOptionList(
    criterion.multi
      ? criterionState?.selectedValues
      : [criterionState?.selectedValue]
  )

  if (selectedValues.length === 0) {
    return { status: 'inactive', score: 0, excluded: false, comparable: false }
  }

  const value = normalizeOptionValue(vehicleValue)
  if (!value) {
    return {
      status: 'missing',
      score: 0,
      excluded: false,
      comparable: false,
      value: null,
      selectedValue: selectedValues[0] ?? '',
      selectedValues,
    }
  }

  const matchesSelection = selectedValues.some((selectedValue) => value.toLowerCase() === selectedValue.toLowerCase())

  if (matchesSelection) {
    return {
      status: 'good',
      score: 2,
      excluded: false,
      comparable: true,
      value,
      selectedValue: selectedValues[0] ?? '',
      selectedValues,
    }
  }

  return {
    status: 'insufficient',
    score: -2,
    excluded: true,
    comparable: true,
    value,
    selectedValue: selectedValues[0] ?? '',
    selectedValues,
  }
}

function evaluateBooleanCriterion(vehicleValue, criterionState) {
  const selectedValue = normalizeBooleanLike(criterionState?.selectedValue)
  if (!selectedValue) {
    return { status: 'inactive', score: 0, excluded: false, comparable: false }
  }

  const value = normalizeBooleanLike(vehicleValue)
  if (!value) {
    return {
      status: 'missing',
      score: 0,
      excluded: false,
      comparable: false,
      value: null,
      selectedValue,
    }
  }

  if (value === selectedValue) {
    return { status: 'good', score: 2, excluded: false, comparable: true, value, selectedValue }
  }

  return { status: 'insufficient', score: -2, excluded: true, comparable: true, value, selectedValue }
}

export function evaluateAdvisorCriterion(vehicleValue, criterion, criterionState) {
  if (!criterionState?.enabled) {
    return { status: 'inactive', score: 0, excluded: false, comparable: false }
  }

  if (criterion.kind === 'select') {
    return evaluateSelectCriterion(vehicleValue, criterion, criterionState)
  }

  if (criterion.kind === 'boolean') {
    return evaluateBooleanCriterion(vehicleValue, criterionState)
  }

  return evaluateNumberCriterion(vehicleValue, criterion, criterionState)
}

function getFitStatus(totalScore, comparableCriteriaCount) {
  if (comparableCriteriaCount === 0) return 'neutral'
  if (totalScore >= comparableCriteriaCount * 1.4) return 'strong'
  if (totalScore >= 0) return 'okay'
  return 'warning'
}

function getLeadingEvaluations(currentEntry, nextEntry) {
  const nextByFieldKey = new Map(
    (nextEntry?.evaluations ?? []).map((evaluation) => [evaluation.criterion.fieldKey, evaluation])
  )

  const strongerCriteria = currentEntry.evaluations
    .filter((evaluation) => evaluation.status === 'good' || evaluation.status === 'ok')
    .map((evaluation) => {
      const nextEvaluation = nextByFieldKey.get(evaluation.criterion.fieldKey)
      return {
        ...evaluation,
        scoreDelta: evaluation.score - (nextEvaluation?.score ?? 0),
      }
    })
    .filter((evaluation) => evaluation.scoreDelta > 0)
    .sort((left, right) => right.scoreDelta - left.scoreDelta)

  if (strongerCriteria.length > 0) {
    return strongerCriteria.slice(0, 3)
  }

  return currentEntry.evaluations
    .filter((evaluation) => evaluation.status === 'good' || evaluation.status === 'ok')
    .slice(0, 3)
}

export function getAdvisorCriterionOptions(criterion, vehicles = []) {
  if (criterion.kind === 'boolean') {
    return [
      { value: 'yes', label: 'Ja / Yes' },
      { value: 'no', label: 'Nein / No' },
    ]
  }

  if (criterion.kind !== 'select') return []

  const values = new Set()

  vehicles.forEach((vehicle) => {
    const value = normalizeOptionValue(vehicle?.[criterion.fieldKey])
    if (value) {
      values.add(value)
    }
  })

  return [...values]
    .sort((left, right) => left.localeCompare(right, 'de', { sensitivity: 'base' }))
    .map((value) => ({ value, label: value }))
}

export function getAdvisorCriteriaGroups(criteria = []) {
  const criteriaById = new Map(criteria.map((criterion) => [criterion.id, criterion]))

  return ADVISOR_CRITERIA_GROUPS.map((group) => ({
    ...group,
    criteria: group.criteria
      .map((criterionId) => criteriaById.get(criterionId))
      .filter(Boolean),
  })).filter((group) => group.criteria.length > 0)
}

export function scoreAdvisorVehicles({ vehicles = [], drivetrain = 'all', criteriaState = {} }) {
  const visibleCriteria = getAdvisorCriteriaForDrivetrain(drivetrain)
  const activeCriteria = visibleCriteria.filter((criterion) => criteriaState[criterion.id]?.enabled)

  const candidates = vehicles.filter((vehicle) => (drivetrain === 'all' ? true : vehicle.vehicleType === drivetrain))

  const scoredVehicles = candidates.map((vehicle) => {
    const evaluations = activeCriteria.map((criterion) => ({
      criterion,
      ...evaluateAdvisorCriterion(vehicle[criterion.fieldKey], criterion, criteriaState[criterion.id]),
    }))

    const excluded = evaluations.some((evaluation) => evaluation.excluded)
    const comparableCriteriaCount = evaluations.filter((evaluation) => evaluation.comparable).length
    const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0)
    const positiveMatches = evaluations.filter((evaluation) => evaluation.status === 'good' || evaluation.status === 'ok')
    const warnings = evaluations.filter((evaluation) => evaluation.status === 'weak' || evaluation.status === 'missing')

    return {
      vehicle,
      evaluations,
      excluded,
      totalScore,
      comparableCriteriaCount,
      positiveMatches,
      warnings,
      fitStatus: getFitStatus(totalScore, comparableCriteriaCount),
    }
  })

  const results = scoredVehicles
    .filter((entry) => !entry.excluded)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      if (b.positiveMatches.length !== a.positiveMatches.length) return b.positiveMatches.length - a.positiveMatches.length
      return `${a.vehicle.marke} ${a.vehicle.modell}`.localeCompare(`${b.vehicle.marke} ${b.vehicle.modell}`, 'de')
    })
    .map((entry, index, rankedResults) => ({
      ...entry,
      rank: index + 1,
      leadingEvaluations: getLeadingEvaluations(entry, rankedResults[index + 1]),
    }))

  return {
    activeCriteriaCount: activeCriteria.length,
    excludedCount: scoredVehicles.length - results.length,
    totalCandidates: candidates.length,
    results,
  }
}
