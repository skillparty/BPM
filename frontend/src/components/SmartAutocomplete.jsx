import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Phone, Building2, X, Loader2, Plus } from 'lucide-react';

/**
 * Componente de autocompletado inteligente
 * Soporta búsqueda en tiempo real con debounce
 */
const SmartAutocomplete = ({
  value,
  onChange,
  onSelect,
  options = [],
  placeholder = 'Buscar...',
  displayField = 'name',
  secondaryField = null,
  icon: Icon = Search,
  loading = false,
  disabled = false,
  required = false,
  error = null,
  onCreateNew = null,
  createNewLabel = 'Crear nuevo',
  minChars = 2,
  maxResults = 10,
  debounceMs = 300,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value || '');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sincronizar valor externo
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar opciones
  const filteredOptions = options
    .filter(option => {
      const searchValue = inputValue.toLowerCase();
      const primary = option[displayField]?.toLowerCase() || '';
      const secondary = secondaryField ? option[secondaryField]?.toLowerCase() || '' : '';
      return primary.includes(searchValue) || secondary.includes(searchValue);
    })
    .slice(0, maxResults);

  // Manejar cambio de input con debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);

    // Debounce para el onChange
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onChange?.(newValue);
    }, debounceMs);

    // Abrir dropdown si hay suficientes caracteres
    if (newValue.length >= minChars) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Seleccionar opción
  const handleSelect = (option) => {
    setInputValue(option[displayField]);
    onSelect?.(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Limpiar input
  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    onSelect?.(null);
    inputRef.current?.focus();
  };

  // Navegación con teclado
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && inputValue.length >= minChars) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && (filteredOptions.length > 0 || onCreateNew);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= minChars && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm transition-all duration-200
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
          `}
        />

        {/* Botón limpiar */}
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fade-in">
          {/* Resultados */}
          {filteredOptions.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option, index) => (
                <li
                  key={option.id || option[displayField] || index}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2.5 cursor-pointer transition-colors ${
                    highlightedIndex === index
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {option[displayField]}
                      </p>
                      {secondaryField && option[secondaryField] && (
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{option[secondaryField]}</span>
                          {option.empresa && (
                            <>
                              <span className="mx-1">•</span>
                              <Building2 className="w-3 h-3" />
                              <span>{option.empresa}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No se encontraron resultados
            </div>
          )}

          {/* Opción crear nuevo */}
          {onCreateNew && (
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onCreateNew(inputValue);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{createNewLabel}: "{inputValue}"</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartAutocomplete;
