// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const isStrongPassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Validate registration input
export const validateRegistration = (name, email, password) => {
  const errors = {};
  
  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (name && name.trim().length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }
  
  if (!email || !isValidEmail(email)) {
    errors.email = 'Please provide a valid email';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate login input
export const validateLogin = (email, password) => {
  const errors = {};
  
  if (!email || !isValidEmail(email)) {
    errors.email = 'Please provide a valid email';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};