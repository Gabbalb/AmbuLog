'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: 'text' | 'number' | 'tel' | 'email' | 'time' | 'date' | 'textarea' | 'select' | 'toggle';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  suggestions?: string[];
}

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  suggestions = [],
}: FormFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions if clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update filtered suggestions based on typing
  const handleInputChange = (val: string) => {
    onChange(val);
    if (suggestions.length > 0 && val.length > 1) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s: string) => {
    onChange(s);
    setShowSuggestions(false);
  };

  const renderControl = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="input-premium min-h-[96px] resize-y"
          />
        );
      case 'select':
        return (
          <div className="relative">
            <select
              id={id}
              value={value !== undefined && value !== null ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className="input-premium appearance-none pr-10"
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        );
      case 'toggle':
        const isChecked = !!value;
        return (
          <label className="flex items-center justify-between cursor-pointer py-1.5 touch-target">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{placeholder}</span>
            <div className="relative">
              <input
                id={id}
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`block h-7 w-12 rounded-full transition-colors ${isChecked ? 'bg-teal-600' : 'bg-slate-350 dark:bg-slate-700'}`}></div>
              <div className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        );
      default:
        return (
          <div className="relative">
            <input
              id={id}
              type={type}
              value={value !== undefined && value !== null ? value : ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0 && String(value).length > 1) {
                  const filtered = suggestions.filter((s) =>
                    s.toLowerCase().includes(String(value).toLowerCase())
                  );
                  setFilteredSuggestions(filtered);
                  setShowSuggestions(filtered.length > 0);
                }
              }}
              placeholder={placeholder}
              required={required}
              className="input-premium"
            />
            {showSuggestions && (
              <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg no-scrollbar">
                {filteredSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="flex w-full items-center gap-2 px-3.5 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-50 dark:border-slate-800/50 last:border-b-0"
                  >
                    <MapPin className="h-4 w-4 text-teal-600" />
                    <span className="font-medium text-slate-750 dark:text-slate-200">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 w-full">
      {type !== 'toggle' && (
        <label htmlFor={id} className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {type === 'toggle' && (
        <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {label}
        </span>
      )}
      {renderControl()}
    </div>
  );
}
