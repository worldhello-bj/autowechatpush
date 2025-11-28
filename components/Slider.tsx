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
const getColorVariants = (colorClass: string): { bg: string; text: string; accent: string } => {
  const colorMap: Record<string, { bg: string; text: string; accent: string }> = {
    'bg-purple-500': { bg: 'bg-purple-100', text: 'text-purple-700', accent: '#a855f7' },
    'bg-blue-500': { bg: 'bg-blue-100', text: 'text-blue-700', accent: '#3b82f6' },
    'bg-green-500': { bg: 'bg-green-100', text: 'text-green-700', accent: '#22c55e' },
    'bg-orange-500': { bg: 'bg-orange-100', text: 'text-orange-700', accent: '#f97316' },
    'bg-pink-500': { bg: 'bg-pink-100', text: 'text-pink-700', accent: '#ec4899' },
    'bg-red-500': { bg: 'bg-red-100', text: 'text-red-700', accent: '#ef4444' },
    'bg-cyan-500': { bg: 'bg-cyan-100', text: 'text-cyan-700', accent: '#06b6d4' },
    'bg-indigo-500': { bg: 'bg-indigo-100', text: 'text-indigo-700', accent: '#6366f1' },
    'bg-amber-500': { bg: 'bg-amber-100', text: 'text-amber-700', accent: '#f59e0b' },
    'bg-teal-500': { bg: 'bg-teal-100', text: 'text-teal-700', accent: '#14b8a6' },
  };
  return colorMap[colorClass] || { bg: 'bg-gray-100', text: 'text-gray-700', accent: '#6b7280' };
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

  // Generate inline styles for the slider
  const sliderStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${colorVariants.accent} 0%, ${colorVariants.accent} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
    WebkitAppearance: 'none',
    appearance: 'none',
    height: '8px',
    borderRadius: '9999px',
    outline: 'none',
    cursor: 'pointer',
  };

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
      
      {/* Native range input with inline gradient styling */}
      <style>
        {`
          .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${colorVariants.accent};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .custom-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${colorVariants.accent};
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `}
      </style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full custom-slider"
        style={sliderStyle}
      />
      
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
