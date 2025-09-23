// Input validation and sanitization utilities
import DOMPurify from 'isomorphic-dompurify';

export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  username: (username) => {
    // 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  tournamentName: (name) => {
    // 3-100 characters, no special HTML chars
    return name && name.length >= 3 && name.length <= 100 && !/<[^>]*>/g.test(name);
  },

  positiveInteger: (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
  },

  percentage: (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && num <= 100;
  }
};

export const sanitizers = {
  // Remove HTML tags and encode entities
  text: (input) => {
    if (!input) return '';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  },

  // Allow only specific HTML tags for rich text
  richText: (input) => {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  },

  // Remove potentially dangerous characters from file names
  filename: (input) => {
    if (!input) return '';
    return input.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const rule = rules[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      return;
    }
    
    if (value && rule.validator && !rule.validator(value)) {
      errors[field] = rule.message || `Invalid ${field}`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
