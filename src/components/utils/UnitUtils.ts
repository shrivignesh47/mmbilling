
// Different types of units for products
export type UnitType = 'kg' | 'liter' | 'piece' | 'pack';

// Format quantity with appropriate unit
export const formatQuantityWithUnit = (quantity: number, unitType: UnitType): string => {
  switch (unitType) {
    case 'kg':
      return `${quantity.toFixed(2)} kg`;
    case 'liter':
      return `${quantity.toFixed(2)} L`;
    case 'piece':
      return `${Math.round(quantity)} pcs`;
    case 'pack':
      return `${Math.round(quantity)} pack`;
    default:
      return `${quantity}`;
  }
};

// Format decimal quantity for display (for kg/liter units)
export const formatDecimalQuantity = (quantity: number, unitType: UnitType): string => {
  if (unitType === 'kg' || unitType === 'liter') {
    return quantity.toFixed(3);
  }
  return Math.round(quantity).toString();
};
