import {
  CANONICAL_VEHICLE_SCHEMA_VERSION,
  VEHICLE_FIELD_SCHEMA,
  getCanonicalFieldDefinitions,
  getCardFields,
  getFieldDefinition,
  getFormFields,
  getRequiredFieldKeys,
  matchFieldKey,
} from './vehicleFields.js'

export const EV_FIELDS = getFormFields('ev')
export const ICE_FIELDS = getFormFields('ice')

export const EV_CARD_FIELDS = getCardFields('ev')
export const ICE_CARD_FIELDS = getCardFields('ice')

export function normalizeCardFields(fields = [], vehicleType = 'ev') {
  const defaults = getCardFields(vehicleType)
  const defaultByKey = Object.fromEntries(defaults.map((field) => [field.key, field]))

  const overrides = fields.reduce((accumulator, field) => {
    const key = matchFieldKey(field?.key ?? field?.label_de ?? field?.label_en ?? '', vehicleType)
    if (!key || !defaultByKey[key]) return accumulator

    accumulator[key] = {
      ...defaultByKey[key],
      visible: typeof field.visible === 'boolean' ? field.visible : defaultByKey[key].visible,
      order: Number.isFinite(field.order) ? field.order : defaultByKey[key].order,
    }

    return accumulator
  }, {})

  return defaults
    .map((field) => overrides[field.key] ?? field)
    .sort((a, b) => a.order - b.order)
}

export {
  CANONICAL_VEHICLE_SCHEMA_VERSION,
  VEHICLE_FIELD_SCHEMA,
  getCanonicalFieldDefinitions,
  getFieldDefinition,
  getRequiredFieldKeys,
  matchFieldKey,
}
