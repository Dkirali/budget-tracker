import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Dropdown.css';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
  required?: boolean;
}

export const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  label,
  id,
  required = false,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 300 });
  const [isAbove, setIsAbove] = useState(false);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  const selectedIndex = options.findIndex(opt => opt.value === value);

  // Calculate dropdown position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(options.length * 48 + 16, 300); // 48px per item + padding
    const spaceBelow = viewportHeight - triggerRect.bottom - 16; // 16px margin
    const spaceAbove = triggerRect.top - 16;
    
    // Decide whether to show above or below
    const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    setIsAbove(shouldShowAbove);
    
    // Calculate position
    let top = shouldShowAbove 
      ? triggerRect.top - dropdownHeight - 8 
      : triggerRect.bottom + 8;
    
    // Ensure dropdown stays within viewport
    if (top < 8) top = 8;
    if (top + dropdownHeight > viewportHeight - 8) {
      top = viewportHeight - dropdownHeight - 8;
    }
    
    setPosition({
      top,
      left: triggerRect.left,
      width: triggerRect.width,
      maxHeight: Math.min(dropdownHeight, viewportHeight - 16),
    });
  }, [options.length]);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    calculatePosition();
    setIsOpen(true);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, calculatePosition, selectedIndex]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  // Handle option selection
  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
  }, [onChange, closeDropdown]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          openDropdown();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setHighlightedIndex(prev => {
            const next = prev + 1;
            return next >= options.length ? 0 : next;
          });
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setHighlightedIndex(prev => {
            const next = prev - 1;
            return next < 0 ? options.length - 1 : next;
          });
        }
        break;
        
      case 'Home':
        e.preventDefault();
        if (isOpen) setHighlightedIndex(0);
        break;
        
      case 'End':
        e.preventDefault();
        if (isOpen) setHighlightedIndex(options.length - 1);
        break;
        
      case 'Tab':
        if (isOpen) {
          closeDropdown();
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, options, handleSelect, openDropdown, closeDropdown]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      closeDropdown();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Scroll and resize handlers
  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, calculatePosition]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle modal cleanup
  useEffect(() => {
    return () => {
      closeDropdown();
    };
  }, [closeDropdown]);

  return (
    <div className="dropdown-wrapper">
      {label && (
        <label htmlFor={id} className="dropdown-label">
          {label}
          {required && <span className="dropdown-required">*</span>}
        </label>
      )}
      
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => isOpen ? closeDropdown() : openDropdown()}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
      >
        <span className={`dropdown-trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`dropdown-trigger-icon ${isOpen ? 'open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`dropdown-menu ${isAbove ? 'above' : 'below'}`}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
          }}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : id}
        >
          <ul ref={listRef} className="dropdown-list">
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                className={`dropdown-option ${
                  option.value === value ? 'selected' : ''
                } ${index === highlightedIndex ? 'highlighted' : ''} ${
                  option.disabled ? 'disabled' : ''
                }`}
                onClick={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                tabIndex={-1}
              >
                <span className="dropdown-option-label">{option.label}</span>
                {option.value === value && (
                  <Check size={16} className="dropdown-option-check" aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
