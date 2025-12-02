import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para validación de formularios en tiempo real
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Validar un campo individual
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    for (const rule of rules) {
      if (rule.required && (!value || value === '')) {
        return rule.message || `${name} es requerido`;
      }
      if (rule.minLength && value && value.length < rule.minLength) {
        return rule.message || `Mínimo ${rule.minLength} caracteres`;
      }
      if (rule.maxLength && value && value.length > rule.maxLength) {
        return rule.message || `Máximo ${rule.maxLength} caracteres`;
      }
      if (rule.pattern && value && !rule.pattern.test(value)) {
        return rule.message || 'Formato inválido';
      }
      if (rule.min && value && parseFloat(value) < rule.min) {
        return rule.message || `Valor mínimo: ${rule.min}`;
      }
      if (rule.max && value && parseFloat(value) > rule.max) {
        return rule.message || `Valor máximo: ${rule.max}`;
      }
      if (rule.custom && !rule.custom(value, values)) {
        return rule.message || 'Valor inválido';
      }
    }
    return null;
  }, [validationRules, values]);

  // Validar todos los campos
  const validateAll = useCallback(() => {
    const newErrors = {};
    let valid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        valid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(valid);
    return valid;
  }, [validateField, validationRules, values]);

  // Manejar cambio de valor
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validar solo si el campo ya fue tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Manejar blur (cuando el campo pierde el foco)
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  // Resetear formulario
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  // Actualizar validez general
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error !== null);
    setIsValid(!hasErrors);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValues,
    handleChange,
    handleBlur,
    validateAll,
    reset
  };
};

/**
 * Hook para guardado automático de borradores
 */
export const useAutosave = (key, data, delay = 3000) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Marcar como no inicial después del primer render
  useEffect(() => {
    initialLoadRef.current = false;
  }, []);

  // Guardar automáticamente
  useEffect(() => {
    // No guardar si es el render inicial o si data es null
    if (initialLoadRef.current || data === null) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programar nuevo guardado
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      try {
        localStorage.setItem(key, JSON.stringify(data));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Error al guardar borrador:', e);
      }
      setIsSaving(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  // Obtener borrador guardado
  const getDraft = useCallback(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [key]);

  // Limpiar borrador
  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    setLastSaved(null);
  }, [key]);

  // Verificar si hay borrador
  const hasDraft = useCallback(() => {
    return localStorage.getItem(key) !== null;
  }, [key]);

  return {
    lastSaved,
    isSaving,
    getDraft,
    clearDraft,
    hasDraft
  };
};

/**
 * Hook para indicador de cambios sin guardar
 */
export const useUnsavedChanges = (hasChanges) => {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);
};

export default useFormValidation;
