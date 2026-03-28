/**
 * Common validation utilities
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

export const isNonEmptyString = (value: unknown): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isPositiveInt = (value: unknown): boolean => {
  const num = parseInt(value as string);
  return !isNaN(num) && num > 0;
};

export const sanitizeString = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

export interface ValidationError {
  field: string;
  message: string;
}

export const validateRegisterInput = (
  name: unknown,
  email: unknown,
  password: unknown
): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!isNonEmptyString(name)) errors.push({ field: 'name', message: 'Name is required.' });
  else if ((name as string).trim().length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });

  if (!isNonEmptyString(email)) errors.push({ field: 'email', message: 'Email is required.' });
  else if (!isValidEmail(email as string)) errors.push({ field: 'email', message: 'Invalid email format.' });

  if (!isNonEmptyString(password)) errors.push({ field: 'password', message: 'Password is required.' });
  else if ((password as string).length < 6) errors.push({ field: 'password', message: 'Password must be at least 6 characters.' });

  return errors;
};

export const validateServiceInput = (
  category_id: unknown,
  title: unknown
): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!isPositiveInt(category_id)) errors.push({ field: 'category_id', message: 'Valid category_id is required.' });
  if (!isNonEmptyString(title)) errors.push({ field: 'title', message: 'Title is required.' });
  else if ((title as string).trim().length < 3) errors.push({ field: 'title', message: 'Title must be at least 3 characters.' });
  return errors;
};

export const validateFeedbackInput = (
  service_id: unknown,
  rating: unknown
): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!isPositiveInt(service_id)) errors.push({ field: 'service_id', message: 'Valid service_id is required.' });
  const ratingNum = parseInt(rating as string);
  if (isNaN(ratingNum)) errors.push({ field: 'rating', message: 'Rating must be a number.' });
  else if (!isValidRating(ratingNum)) errors.push({ field: 'rating', message: 'Rating must be between 1 and 5.' });
  return errors;
};
