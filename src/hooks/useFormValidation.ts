import { useState, useCallback } from 'react';
import * as yup from 'yup';

interface UseFormValidationProps {
  schema: yup.ObjectSchema<any>;
  formData: any;
}

export const useFormValidation = ({ schema, formData }: UseFormValidationProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback(async () => {
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});
      setIsValid(true);
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.inner.forEach((err: any) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      setIsValid(false);
      return false;
    }
  }, [schema, formData]);

  const validateField = useCallback(async (fieldName: string) => {
    try {
      await schema.validateAt(fieldName, formData);
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
      return true;
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [fieldName]: error.message }));
      return false;
    }
  }, [schema, formData]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const setFieldError = useCallback((fieldName: string, message: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: message }));
  }, []);

  return { 
    errors, 
    isValid, 
    validate, 
    validateField, 
    clearErrors, 
    setFieldError 
  };
};
