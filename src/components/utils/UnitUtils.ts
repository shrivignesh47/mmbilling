
// Different types of units for products
export type UnitType = 'kg' | 'liter' | 'piece' | 'pack' | 'ml' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'xxxl';

// Categories to unit type mapping
export const getCategoryUnitType = (category: string | undefined): UnitType => {
  if (!category) return 'piece';
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('clothing') || lowerCategory.includes('apparel') || lowerCategory.includes('garment')) {
    return 's'; // Default size for clothing
  } else if (lowerCategory.includes('vegetable') || lowerCategory.includes('fruit') || lowerCategory.includes('produce')) {
    return 'kg';
  } else if (lowerCategory.includes('liquid') || lowerCategory.includes('milk') || lowerCategory.includes('oil')) {
    return 'liter';
  } else if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) {
    return 'ml';
  } else if (lowerCategory.includes('food') || lowerCategory.includes('meal')) {
    return 'piece';
  } else if (lowerCategory.includes('pack') || lowerCategory.includes('bundle')) {
    return 'pack';
  }
  
  return 'piece';
};

// Get unit type options based on category
export const getUnitOptionsForCategory = (category: string | undefined): UnitType[] => {
  if (!category) return ['piece', 'pack', 'kg', 'liter'];
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('clothing') || lowerCategory.includes('apparel') || lowerCategory.includes('garment')) {
    return ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'];
  } else if (lowerCategory.includes('vegetable') || lowerCategory.includes('fruit') || lowerCategory.includes('produce')) {
    return ['kg', 'piece', 'pack'];
  } else if (lowerCategory.includes('liquid') || lowerCategory.includes('milk') || lowerCategory.includes('oil')) {
    return ['liter', 'ml'];
  } else if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) {
    return ['ml', 'liter', 'piece'];
  } else if (lowerCategory.includes('food') || lowerCategory.includes('meal')) {
    return ['piece', 'pack'];
  }
  
  return ['piece', 'pack', 'kg', 'liter', 'ml'];
};

// Format quantity with appropriate unit
export const formatQuantityWithUnit = (quantity: number, unitType: UnitType): string => {
  switch (unitType) {
    case 'kg':
      return `${quantity.toFixed(2)} kg`;
    case 'liter':
      return `${quantity.toFixed(2)} L`;
    case 'ml':
      return `${quantity} ml`;
    case 'piece':
      return `${Math.round(quantity)} pcs`;
    case 'pack':
      return `${Math.round(quantity)} pack`;
    case 's':
    case 'm':
    case 'l':
    case 'xl':
    case 'xxl':
    case 'xxxl':
      return unitType.toUpperCase();
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
