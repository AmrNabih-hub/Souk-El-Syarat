/**
 * Color Validation Utility
 * Ensures consistent use of design system colors across the application
 */

// Design system color palette
export const DESIGN_SYSTEM_COLORS = {
  primary: {
    50: '#fef3e2',
    100: '#fde4b8',
    200: '#fbd389',
    300: '#f9c158',
    400: '#f7b332',
    500: '#f59e0b', // Main brand color - Egyptian gold
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Egyptian blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  accent: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Red for alerts/important actions
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};

// Color class mappings for validation
export const COLOR_CLASS_MAPPINGS = {
  // Primary colors (Egyptian Gold)
  'bg-yellow-': 'bg-primary-',
  'text-yellow-': 'text-primary-',
  'border-yellow-': 'border-primary-',
  'hover:bg-yellow-': 'hover:bg-primary-',
  'hover:text-yellow-': 'hover:text-primary-',
  'hover:border-yellow-': 'hover:border-primary-',
  
  // Secondary colors (Egyptian Blue)
  'bg-blue-': 'bg-secondary-',
  'text-blue-': 'text-secondary-',
  'border-blue-': 'border-secondary-',
  'hover:bg-blue-': 'hover:bg-secondary-',
  'hover:text-blue-': 'hover:text-secondary-',
  'hover:border-blue-': 'hover:border-secondary-',
  
  // Accent colors (Red)
  'bg-red-': 'bg-accent-',
  'text-red-': 'text-accent-',
  'border-red-': 'border-accent-',
  'hover:bg-red-': 'hover:bg-accent-',
  'hover:text-red-': 'hover:text-accent-',
  'hover:border-red-': 'hover:border-accent-',
  
  // Success colors (Green)
  'bg-green-': 'bg-success-',
  'text-green-': 'text-success-',
  'border-green-': 'border-success-',
  'hover:bg-green-': 'hover:bg-success-',
  'hover:text-green-': 'hover:text-success-',
  'hover:border-green-': 'hover:border-success-',
};

// Valid color shades for each color family
export const VALID_COLOR_SHADES = {
  primary: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  secondary: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  accent: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  success: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  neutral: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
};

/**
 * Validates if a color class follows the design system
 */
export function validateColorClass(className: string): {
  isValid: boolean;
  suggestion?: string;
  error?: string;
} {
  // Check for hardcoded colors that should use design system
  for (const [hardcoded, designSystem] of Object.entries(COLOR_CLASS_MAPPINGS)) {
    if (className.includes(hardcoded)) {
      const suggestion = className.replace(hardcoded, designSystem);
      return {
        isValid: false,
        suggestion,
        error: `Use design system color: ${hardcoded} → ${designSystem}`
      };
    }
  }
  
  // Check for valid design system colors
  const designSystemMatch = className.match(/(bg|text|border|hover:bg|hover:text|hover:border)-(primary|secondary|accent|success|neutral)-(\d+)/);
  if (designSystemMatch) {
    const [, , colorFamily, shade] = designSystemMatch;
    const shadeNumber = parseInt(shade);
    
    if (!VALID_COLOR_SHADES[colorFamily as keyof typeof VALID_COLOR_SHADES].includes(shadeNumber)) {
      return {
        isValid: false,
        error: `Invalid shade ${shade} for ${colorFamily}. Valid shades: ${VALID_COLOR_SHADES[colorFamily as keyof typeof VALID_COLOR_SHADES].join(', ')}`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validates all color classes in a component
 */
export function validateComponentColors(componentCode: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Extract all className attributes
  const classNameMatches = componentCode.match(/className=["']([^"']+)["']/g);
  
  if (classNameMatches) {
    classNameMatches.forEach(match => {
      const className = match.match(/className=["']([^"']+)["']/)?.[1];
      if (className) {
        const validation = validateColorClass(className);
        if (!validation.isValid) {
          errors.push(validation.error || 'Invalid color class');
          if (validation.suggestion) {
            suggestions.push(validation.suggestion);
          }
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}

/**
 * Gets the correct color class for a specific use case
 */
export function getColorClass(
  type: 'bg' | 'text' | 'border',
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'neutral',
  shade: number,
  hover?: boolean
): string {
  const prefix = hover ? `hover:${type}-` : `${type}-`;
  return `${prefix}${color}-${shade}`;
}

/**
 * Common color combinations for consistent UI
 */
export const COLOR_COMBINATIONS = {
  primary: {
    button: 'bg-primary-500 text-white hover:bg-primary-600',
    buttonOutline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
    text: 'text-primary-600',
    background: 'bg-primary-50',
  },
  secondary: {
    button: 'bg-secondary-500 text-white hover:bg-secondary-600',
    buttonOutline: 'border-2 border-secondary-500 text-secondary-500 hover:bg-secondary-500 hover:text-white',
    text: 'text-secondary-600',
    background: 'bg-secondary-50',
  },
  accent: {
    button: 'bg-accent-500 text-white hover:bg-accent-600',
    buttonOutline: 'border-2 border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-white',
    text: 'text-accent-600',
    background: 'bg-accent-50',
  },
  success: {
    button: 'bg-success-500 text-white hover:bg-success-600',
    buttonOutline: 'border-2 border-success-500 text-success-500 hover:bg-success-500 hover:text-white',
    text: 'text-success-600',
    background: 'bg-success-50',
  },
  neutral: {
    button: 'bg-neutral-500 text-white hover:bg-neutral-600',
    buttonOutline: 'border-2 border-neutral-500 text-neutral-500 hover:bg-neutral-500 hover:text-white',
    text: 'text-neutral-600',
    background: 'bg-neutral-50',
  },
};

export default {
  DESIGN_SYSTEM_COLORS,
  COLOR_CLASS_MAPPINGS,
  VALID_COLOR_SHADES,
  validateColorClass,
  validateComponentColors,
  getColorClass,
  COLOR_COMBINATIONS,
};