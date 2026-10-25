import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeVariant?: 'frambuesa' | 'chocolate' | 'trigo' | 'crema' | 'success' | 'warning' | 'info' | 'gray';
  category?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps<T = string | number> {
  options: SearchableSelectOption<T>[];
  value: T | '' | null | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  clearable?: boolean;
  onClear?: () => void;
  usePortal?: boolean;
  emptyMessage?: string;
  autoFocusSearch?: boolean;
  icon?: React.ReactNode;
}

// Remove diacritics / accents for seamless typing matching ("azucar" -> "azúcar")
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function SearchableSelect<T extends string | number = string | number>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  size = 'md',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  clearable = false,
  onClear,
  usePortal = true,
  emptyMessage = 'No se encontraron resultados.',
  autoFocusSearch = true,
  icon,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Position state for portal mode
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    placement: 'bottom' | 'top';
  }>({
    top: 0,
    left: 0,
    width: 260,
    placement: 'bottom',
  });

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === '' || value === null || value === undefined) return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const norm = normalizeText(searchTerm);
    return options.filter((opt) => {
      const matchLabel = normalizeText(opt.label).includes(norm);
      const matchSublabel = opt.sublabel ? normalizeText(opt.sublabel).includes(norm) : false;
      const matchBadge = opt.badge ? normalizeText(opt.badge).includes(norm) : false;
      const matchCat = opt.category ? normalizeText(opt.category).includes(norm) : false;
      return matchLabel || matchSublabel || matchBadge || matchCat;
    });
  }, [options, searchTerm]);

  // Update position when opening or on scroll/resize
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280; // approximate max dropdown height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placeAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    const calculatedWidth = Math.max(rect.width, 280);

    // Keep dropdown inside viewport horizontally
    let calculatedLeft = rect.left + window.scrollX;
    if (calculatedLeft + calculatedWidth > window.innerWidth - 12) {
      calculatedLeft = Math.max(12, window.innerWidth - calculatedWidth - 12);
    }

    setDropdownPosition({
      top: placeAbove
        ? rect.top + window.scrollY - 6
        : rect.bottom + window.scrollY + 6,
      left: calculatedLeft,
      width: calculatedWidth,
      placement: placeAbove ? 'top' : 'bottom',
    });
  }, []);

  // Open / Close handlers
  const openDropdown = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Keyboard navigation & outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      closeDropdown();
    };

    const handleScrollOrResize = () => {
      if (usePortal) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, usePortal, updatePosition]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && autoFocusSearch) {
      // Small timeout ensures element is mounted in DOM
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoFocusSearch]);

  // Handle keyboard events inside the search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const option = filteredOptions[highlightedIndex];
        if (!option.disabled) {
          onChange(option.value);
          closeDropdown();
        }
      } else if (filteredOptions.length > 0) {
        // Pick first match if none explicitly highlighted
        const first = filteredOptions[0];
        if (!first.disabled) {
          onChange(first.value);
          closeDropdown();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    }
  };

  // Badge styling helper
  const getBadgeClass = (variant?: SearchableSelectOption['badgeVariant']) => {
    switch (variant) {
      case 'frambuesa':
        return 'bg-frambuesa-50 text-frambuesa-700 border-frambuesa-200';
      case 'chocolate':
        return 'bg-chocolate-50 text-chocolate-800 border-chocolate-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'crema':
        return 'bg-crema text-chocolate-700 border-trigo-200';
      case 'gray':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'trigo':
      default:
        return 'bg-trigo-100 text-trigo-800 border-trigo-300';
    }
  };

  // Button sizing classes
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2.5 rounded-lg min-h-[32px]',
    md: 'text-xs py-2 px-3 rounded-xl min-h-[38px]',
    lg: 'text-sm py-2.5 px-3.5 rounded-xl min-h-[44px]',
  }[size];

  // Render dropdown menu content
  const dropdownMenu = (
    <div
      ref={listRef}
      style={
        usePortal
          ? {
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              transform: dropdownPosition.placement === 'top' ? 'translateY(-100%)' : 'none',
              zIndex: 99999,
            }
          : undefined
      }
      className={`bg-white rounded-2xl border-2 border-trigo-300 shadow-2xl overflow-hidden flex flex-col max-h-[320px] animate-scale-up ${
        !usePortal ? 'absolute left-0 right-0 mt-1 z-50' : ''
      } ${dropdownClassName}`}
    >
      {/* Search Header */}
      <div className="p-2 border-b border-trigo-100 bg-crema/40 sticky top-0 z-10 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-chocolate-400 shrink-0 ml-1" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="w-full text-xs font-semibold bg-transparent border-none outline-none focus:ring-0 text-chocolate-900 placeholder:text-gray-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="p-1 text-gray-400 hover:text-chocolate-700 rounded-full hover:bg-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="overflow-y-auto flex-1 divide-y divide-trigo-100/60 p-1">
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500 italic">
            {emptyMessage}
          </div>
        ) : (
          filteredOptions.map((opt, idx) => {
            const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  closeDropdown();
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-50'
                    : isSelected
                    ? 'bg-frambuesa-50/90 text-frambuesa-900 font-bold'
                    : isHighlighted
                    ? 'bg-crema text-chocolate-900 font-semibold'
                    : 'hover:bg-crema/50 text-chocolate-800'
                }`}
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getBadgeClass(
                          opt.badgeVariant
                        )}`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.sublabel && (
                    <p className="text-[11px] text-gray-500 font-normal truncate mt-0.5">
                      {opt.sublabel}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-frambuesa-600 shrink-0 stroke-[2.5]" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer count indicator */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-trigo-100 text-[10px] font-semibold text-gray-400 flex items-center justify-between">
        <span>{filteredOptions.length} disponibles</span>
        <span className="text-[9px] text-gray-400">Usa ↑ ↓ Enter para elegir</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={isOpen ? closeDropdown : openDropdown}
        className={`w-full flex items-center justify-between gap-2 border border-trigo-300 bg-white font-medium text-chocolate-900 text-left transition-all duration-150 shadow-xs hover:border-frambuesa-400 focus:outline-none focus:ring-2 focus:ring-frambuesa-400/50 ${sizeClasses} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'
        } ${isOpen ? 'ring-2 ring-frambuesa-400 border-frambuesa-500' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="shrink-0 text-chocolate-500">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="truncate text-chocolate-900 font-semibold">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getBadgeClass(
                    selectedOption.badgeVariant
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1 text-chocolate-400">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (onClear) onClear();
              }}
              className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
              title="Limpiar selección"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-frambuesa-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu (via Portal or Inline) */}
      {isOpen && (usePortal ? createPortal(dropdownMenu, document.body) : dropdownMenu)}
    </div>
  );
}
