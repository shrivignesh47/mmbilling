
import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UnitType } from '../utils/UnitUtils';
import { Button } from '../ui/button';
import { Minus, Plus } from 'lucide-react';

interface UnitQuantityInputProps {
  unitType: UnitType;
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const UnitQuantityInput: React.FC<UnitQuantityInputProps> = ({
  unitType,
  quantity,
  onChange,
  min = 0,
  max,
  step
}) => {
  const getStepValue = () => {
    if (step !== undefined) return step;
    // Default step values based on unit type
    return unitType === 'kg' || unitType === 'liter' ? 0.1 : 1;
  };

  const handleIncrement = () => {
    const newValue = quantity + getStepValue();
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = quantity - getStepValue();
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= min && (max === undefined || value <= max)) {
      onChange(value);
    }
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label>Quantity ({unitType})</Label>
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={quantity <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          step={getStepValue()}
          min={min}
          max={max}
          className="text-center"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={max !== undefined && quantity >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UnitQuantityInput;
