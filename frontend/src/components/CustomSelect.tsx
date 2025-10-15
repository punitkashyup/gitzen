import React, { useState, useRef, useEffect } from 'react';
import tokens from '../design/tokens';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectBoxStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
    border: `1px solid ${tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    fontSize: tokens.typography.fontSize.sm.size,
    backgroundColor: tokens.colors.neutral[0],
    cursor: 'pointer',
    transition: tokens.transitions.colors,
    userSelect: 'none',
    ...style
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: tokens.colors.neutral[0],
    border: `1px solid ${tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    boxShadow: tokens.shadows.lg,
    zIndex: 1000,
  };

  const optionStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
    cursor: 'pointer',
    backgroundColor: isSelected ? tokens.colors.primary[50] : 'transparent',
    color: isSelected ? tokens.colors.primary[600] : tokens.colors.neutral[700],
    transition: tokens.transitions.colors,
    fontSize: tokens.typography.fontSize.sm.size,
  });

  const arrowStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    marginLeft: tokens.spacing[2],
    transition: 'transform 0.2s',
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  return (
    <div ref={selectRef} style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={selectBoxStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = tokens.colors.neutral[400];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = tokens.colors.neutral[300];
        }}
      >
        <span style={{ color: selectedOption ? tokens.colors.neutral[900] : tokens.colors.neutral[500] }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          style={arrowStyle}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          fill={tokens.colors.neutral[600]}
        >
          <path d="M6 9L1 4h10z" />
        </svg>
      </div>

      {isOpen && (
        <div style={dropdownStyle}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={optionStyle(option.value === value)}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
