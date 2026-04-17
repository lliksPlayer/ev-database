export const calcKwhNach70 = (batterie_netto) =>
  batterie_netto > 0 ? parseFloat((batterie_netto * 0.7).toFixed(2)) : 0

export const calcKwhProMin = (batterie_netto, laden_10_80_min) =>
  batterie_netto > 0 && laden_10_80_min > 0
    ? parseFloat(((batterie_netto * 0.7) / laden_10_80_min).toFixed(3))
    : 0

export const applyCalculations = (data) => ({
  ...data,
  kwh_nach_70: calcKwhNach70(data.batterie_netto),
  kwh_pro_min: calcKwhProMin(data.batterie_netto, data.laden_10_80_min),
})
