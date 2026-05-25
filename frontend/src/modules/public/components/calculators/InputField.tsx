import { useState, useEffect } from 'react';

export interface InputFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  symbol?: string;
  symbolPosition?: 'left' | 'right';
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
}

export function InputField({ label, value, min, max, step, symbol, symbolPosition = 'left', onChange, formatter }: InputFieldProps) {
  
  // Use local state to allow users to type decimal points and clear the input
  const [inputValue, setInputValue] = useState<string>(
    formatter ? formatter(value) : value.toLocaleString('en-IN')
  );

  // Sync with prop value when it changes from outside
  useEffect(() => {
    const formatted = formatter ? formatter(value) : value.toLocaleString('en-IN');
    // Only update if the parsed value is different to avoid jumping while typing
    const parsedInput = Number(inputValue.replace(/[^0-9.]/g, ''));
    if (parsedInput !== value) {
      setInputValue(formatted);
    }
  }, [value, formatter]);

  const percent = ((value - min) / (max - min)) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    
    let rawValue = Number(text.replace(/[^0-9.]/g, ''));
    if (!isNaN(rawValue)) {
      onChange(rawValue);
    }
  };
  
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange(val);
    setInputValue(formatter ? formatter(val) : val.toLocaleString('en-IN'));
  };
  
  const handleBlur = () => {
    let rawValue = Number(inputValue.replace(/[^0-9.]/g, ''));
    if (isNaN(rawValue)) rawValue = min;
    const clampedValue = Math.min(Math.max(rawValue, min), max);
    onChange(clampedValue);
    setInputValue(formatter ? formatter(clampedValue) : clampedValue.toLocaleString('en-IN'));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</label>
        
        <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all w-32 md:w-40">
           {symbol && symbolPosition === 'left' && (
             <span className="text-sm font-bold text-slate-500 pl-3">{symbol}</span>
           )}
           <input 
             type="text" 
             value={inputValue} 
             onChange={handleInputChange} 
             onBlur={handleBlur}
             className="w-full bg-transparent outline-none text-right font-black text-slate-800 dark:text-slate-100 pr-3 disabled:opacity-50"
             style={{ width: '100%' }}
           />
           {symbol && symbolPosition === 'right' && (
             <span className="text-sm font-bold text-slate-500 pr-3">{symbol}</span>
           )}
        </div>
      </div>
      
      <div className="relative pt-2">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={Math.min(Math.max(value, min), max)} 
          onChange={handleRangeChange} 
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer outline-none relative z-10 slider-thumb"
          style={{
            background: `linear-gradient(to right, #0055ff ${percent}%, #e2e8f0 ${percent}%)`,
          }}
        />
        <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #ffffff;
            border: 2px solid #0055ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transition: all 0.2s;
          }
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            background: #f8fafc;
          }
          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #ffffff;
            border: 2px solid #0055ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
        `}</style>
      </div>
      <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
        <span>{symbolPosition === 'left' ? symbol : ''} {formatter ? formatter(min) : min.toLocaleString('en-IN')} {symbolPosition === 'right' ? symbol : ''}</span>
        <span>{symbolPosition === 'left' ? symbol : ''} {formatter ? formatter(max) : max.toLocaleString('en-IN')} {symbolPosition === 'right' ? symbol : ''}</span>
      </div>
    </div>
  );
}

