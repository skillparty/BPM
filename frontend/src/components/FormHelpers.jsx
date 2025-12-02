import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Save,
  CloudOff,
  RefreshCw,
  Trash2
} from 'lucide-react';

/**
 * Indicador de guardado automático
 */
export const AutosaveIndicator = ({ lastSaved, isSaving, onRestore, onClear, hasDraft }) => {
  if (!lastSaved && !isSaving && !hasDraft) return null;

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isSaving ? (
        <div className="flex items-center space-x-1 text-slate-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Guardando borrador...</span>
        </div>
      ) : lastSaved ? (
        <div className="flex items-center space-x-1 text-green-600">
          <Save className="w-3 h-3" />
          <span>Guardado {formatTime(lastSaved)}</span>
        </div>
      ) : hasDraft && (
        <div className="flex items-center space-x-3">
          <span className="text-amber-600 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Borrador disponible</span>
          </span>
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Restaurar
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-slate-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Mensaje de validación inline
 */
export const ValidationMessage = ({ error, success, info, className = '' }) => {
  if (!error && !success && !info) return null;

  const type = error ? 'error' : success ? 'success' : 'info';
  const message = error || success || info;

  const styles = {
    error: 'text-red-600 bg-red-50',
    success: 'text-green-600 bg-green-50',
    info: 'text-blue-600 bg-blue-50'
  };

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs ${styles[type]} ${className}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Input con validación integrada
 */
export const ValidatedInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  hint,
  className = '',
  ...props
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-10' : 'px-3'} pr-10 py-2.5 border rounded-lg text-sm transition-all duration-200
            ${showError 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : showSuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        />

        {/* Indicador de estado */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showError && <AlertCircle className="w-4 h-4 text-red-500" />}
          {showSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
      </div>

      {/* Hint o error */}
      {showError ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
};

/**
 * Select con validación integrada
 */
export const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options = [],
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  valueField = 'id',
  labelField = 'name',
  className = ''
}) => {
  const showError = touched && error;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-all duration-200
          ${showError 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
            : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          }
          ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option[valueField]} value={option[valueField]}>
            {option[labelField]}
          </option>
        ))}
      </select>

      {showError && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

/**
 * Barra de progreso del formulario
 */
export const FormProgress = ({ steps, currentStep, completedSteps = [] }) => {
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = currentStep === index;
        
        return (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${isCompleted 
                ? 'bg-green-500 text-white' 
                : isCurrent 
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-1 rounded ${
                isCompleted ? 'bg-green-500' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper para formatear tiempo
function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  
  return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

export default {
  AutosaveIndicator,
  ValidationMessage,
  ValidatedInput,
  ValidatedSelect,
  FormProgress
};
