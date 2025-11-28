import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  description?: string;
  colorClass?: string; // For customizing the slider track color
  icon?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  description,
  colorClass = 'bg-purple-500',
  icon
}) => {
  // Calculate percentage for the filled track
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="material-icons text-sm text-gray-500">{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-0.5 rounded ${colorClass.replace('bg-', 'bg-').replace('-500', '-100')} ${colorClass.replace('bg-', 'text-').replace('-500', '-700')}`}>
          {value}{unit}
        </span>
      </div>
      
      <div className="relative">
        {/* Track background */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Filled track */}
          <div 
            className={`h-full ${colorClass} rounded-full transition-all duration-150`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Range input (invisible but functional) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${colorClass} rounded-full shadow-md border-2 border-white pointer-events-none transition-all duration-150`}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}

      {/* Quick preset buttons */}
      <div className="flex gap-1 mt-2">
        {[min, Math.round((min + max) / 2), max].map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`text-xs px-2 py-0.5 rounded transition ${
              value === preset 
                ? `${colorClass} text-white` 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {preset === min ? '低' : preset === max ? '高' : '中'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Slider;
