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

// Color mapping for generating light background and text colors
const getColorVariants = (colorClass: string): { bg: string; text: string } => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    'bg-purple-500': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'bg-blue-500': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'bg-green-500': { bg: 'bg-green-100', text: 'text-green-700' },
    'bg-orange-500': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'bg-pink-500': { bg: 'bg-pink-100', text: 'text-pink-700' },
    'bg-red-500': { bg: 'bg-red-100', text: 'text-red-700' },
    'bg-cyan-500': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'bg-indigo-500': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    'bg-amber-500': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'bg-teal-500': { bg: 'bg-teal-100', text: 'text-teal-700' },
  };
  return colorMap[colorClass] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

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
  
  // Get color variants for the value badge
  const colorVariants = getColorVariants(colorClass);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="material-icons text-sm text-gray-500">{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-0.5 rounded ${colorVariants.bg} ${colorVariants.text}`}>
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
