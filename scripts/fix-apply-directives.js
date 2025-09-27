#!/usr/bin/env node

/**
 * 🔧 FIX @APPLY DIRECTIVES SCRIPT
 * Systematically replaces all @apply directives with raw CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common @apply to CSS mappings
const applyMappings = {
  // Layout
  'inline-flex': 'display: inline-flex',
  'flex': 'display: flex',
  'items-center': 'align-items: center',
  'justify-center': 'justify-content: center',
  'justify-between': 'justify-content: space-between',
  'flex-col': 'flex-direction: column',
  'flex-row': 'flex-direction: row',
  'flex-wrap': 'flex-wrap: wrap',
  
  // Spacing
  'p-2': 'padding: 0.5rem',
  'p-3': 'padding: 0.75rem',
  'p-4': 'padding: 1rem',
  'px-3': 'padding-left: 0.75rem; padding-right: 0.75rem',
  'px-4': 'padding-left: 1rem; padding-right: 1rem',
  'py-2': 'padding-top: 0.5rem; padding-bottom: 0.5rem',
  'py-3': 'padding-top: 0.75rem; padding-bottom: 0.75rem',
  'py-6': 'padding-top: 1.5rem; padding-bottom: 1.5rem',
  'm-0': 'margin: 0',
  'mx-2': 'margin-left: 0.5rem; margin-right: 0.5rem',
  'my-3': 'margin-top: 0.75rem; margin-bottom: 0.75rem',
  
  // Sizing
  'w-full': 'width: 100%',
  'w-px': 'width: 1px',
  'h-px': 'height: 1px',
  'h-8': 'height: 2rem',
  'w-8': 'width: 2rem',
  'min-h-[44px]': 'min-height: 44px',
  
  // Colors
  'text-white': 'color: white',
  'text-neutral-300': 'color: #d4d4d4',
  'text-neutral-600': 'color: #737373',
  'text-neutral-700': 'color: #404040',
  'text-neutral-800': 'color: #262626',
  'text-primary-400': 'color: #fbbf24',
  'text-primary-600': 'color: #d97706',
  'text-primary-700': 'color: #b45309',
  'text-primary-800': 'color: #92400e',
  'text-primary-900': 'color: #78350f',
  'text-yellow-400': 'color: #fbbf24',
  'bg-white': 'background-color: white',
  'bg-neutral-50': 'background-color: #fafafa',
  'bg-neutral-800': 'background-color: #262626',
  'bg-neutral-900': 'background-color: #171717',
  'bg-primary-50': 'background-color: #fef3e2',
  'bg-primary-600': 'background-color: #d97706',
  'bg-primary-800': 'background-color: #92400e',
  'bg-gradient-to-r': 'background: linear-gradient(to right',
  'from-neutral-200': 'from #e5e5e5',
  'to-neutral-300': 'to #d4d4d4',
  'from-gray-200': 'from #e5e5e5',
  'to-gray-300': 'to #d4d4d4',
  
  // Borders
  'border': 'border: 1px solid',
  'border-2': 'border-width: 2px',
  'border-0': 'border: 0',
  'border-r': 'border-right: 1px solid',
  'border-neutral-200': 'border-color: #e5e5e5',
  'border-neutral-300': 'border-color: #d4d4d4',
  'border-primary-200': 'border-color: #fde4b8',
  'border-primary-500': 'border-color: #f59e0b',
  'border-primary-600': 'border-color: #d97706',
  'border-gray-800': 'border-color: #1f2937',
  'border-black': 'border-color: black',
  'rounded-lg': 'border-radius: 0.5rem',
  'rounded-xl': 'border-radius: 0.75rem',
  'rounded-full': 'border-radius: 9999px',
  'rounded-none': 'border-radius: 0',
  'rounded-br-lg': 'border-bottom-right-radius: 0.5rem',
  'first:rounded-l-lg': 'border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem',
  'last:rounded-r-lg': 'border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem',
  
  // Shadows
  'shadow-sm': 'box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'shadow-md': 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'shadow-lg': 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'shadow-xl': 'box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  'shadow-2xl': 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'shadow-none': 'box-shadow: none',
  
  // Effects
  'backdrop-blur-lg': '-webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px)',
  'backdrop-blur-xl': '-webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px)',
  'overflow-hidden': 'overflow: hidden',
  'overflow-wrap': 'overflow-wrap: break-word',
  
  // Positioning
  'absolute': 'position: absolute',
  'relative': 'position: relative',
  'top-0': 'top: 0',
  'left-0': 'left: 0',
  'bottom-0': 'bottom: 0',
  'right-0': 'right: 0',
  '-m-px': 'margin: -1px',
  '-translate-y-full': 'transform: translateY(-100%)',
  'transform': 'transform',
  'scale-x-100': 'transform: scaleX(1)',
  'translate-y-0': 'transform: translateY(0)',
  '-translate-y-0.5': 'transform: translateY(-0.125rem)',
  
  // Typography
  'font-bold': 'font-weight: 700',
  'font-semibold': 'font-weight: 600',
  'font-medium': 'font-weight: 500',
  'text-xs': 'font-size: 0.75rem; line-height: 1rem',
  'text-sm': 'font-size: 0.875rem; line-height: 1.25rem',
  'text-xl': 'font-size: 1.25rem; line-height: 1.75rem',
  'text-center': 'text-align: center',
  'whitespace-nowrap': 'white-space: nowrap',
  
  // Animations
  'animate-spin': 'animation: spin 1s linear infinite',
  'animate-pulse': 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'transition-all': 'transition: all',
  'duration-200': 'transition-duration: 0.2s',
  'duration-300': 'transition-duration: 0.3s',
  'ease-in-out': 'transition-timing-function: ease-in-out',
  
  // Focus states
  'focus:outline-none': 'outline: none',
  'focus:ring-2': 'box-shadow: 0 0 0 2px',
  'focus:ring-primary-500': 'box-shadow: 0 0 0 2px #f59e0b',
  'focus:ring-offset-1': 'box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(245, 158, 11, 0.1)',
  'focus:ring-offset-2': 'box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(245, 158, 11, 0.1)',
  'focus:ring-offset-white': 'box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(255, 255, 255, 0.1)',
  'focus:border-primary-500': 'border-color: #f59e0b',
  'focus:border-primary-600': 'border-color: #d97706',
  'focus:translate-y-0': 'transform: translateY(0)',
  
  // Hover states
  'hover:text-primary-600': 'color: #d97706',
  'hover:text-primary-700': 'color: #b45309',
  'hover:text-primary-900': 'color: #78350f',
  'hover:bg-primary-50': 'background-color: #fef3e2',
  'hover:shadow-md': 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'hover:-translate-y-0.5': 'transform: translateY(-0.125rem)',
  'hover:border-primary-700': 'border-color: #b45309',
  
  // Active states
  'active:': '',
  
  // Responsive
  'sm:': '',
  'md:': '',
  'lg:': '',
  'xl:': '',
  '2xl:': '',
  
  // RTL
  '[dir=\'rtl\']': '',
  'flex-row-reverse': 'flex-direction: row-reverse',
  
  // Dark mode
  'dark:': '',
  'dark.bg-neutral-900': 'background-color: #171717',
  'dark.text-primary-400': 'color: #fbbf24',
  'dark.text-primary-300': 'color: #fcd34d',
  'dark.text-neutral-300': 'color: #d4d4d4',
  'dark.border-primary-600': 'border-color: #d97706',
  'dark.border-t': 'border-top: 1px solid',
  'dark.border-b': 'border-bottom: 1px solid',
  'dark.border': 'border: 1px solid',
  'dark.shadow-xl': 'box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  'dark.shadow-2xl': 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'dark.backdrop-blur-lg': '-webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px)',
  'dark.backdrop-blur-xl': '-webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px)',
  'dark.bg-neutral-800': 'background-color: #262626',
  'dark.focus:border-primary-500': 'border-color: #f59e0b',
  'dark.focus:ring-primary-500': 'box-shadow: 0 0 0 2px #f59e0b',
  'dark.hover:text-primary-400': 'color: #fbbf24',
  'dark.hover:bg-primary-50': 'background-color: #fef3e2',
  
  // Fill
  'fill-current': 'fill: currentColor',
  
  // Other
  'sr-only': 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0',
  'not:last-child': ':not(:last-child)',
  'first:': ':first-child',
  'last:': ':last-child',
  'not:': ':not(',
  '!important': '!important',
};

function convertApplyToCSS(applyString) {
  // Remove @apply and clean up
  let css = applyString.replace(/@apply\s+/, '').trim();
  
  // Split by spaces and convert each utility
  const utilities = css.split(/\s+/);
  const cssProperties = [];
  
  utilities.forEach(utility => {
    if (applyMappings[utility]) {
      cssProperties.push(applyMappings[utility]);
    } else {
      // Handle complex utilities
      if (utility.includes(':')) {
        const [state, prop] = utility.split(':');
        if (applyMappings[state] && applyMappings[prop]) {
          cssProperties.push(`${applyMappings[state]} { ${applyMappings[prop]} }`);
        }
      } else if (utility.includes('[') && utility.includes(']')) {
        // Handle arbitrary values like [44px]
        const match = utility.match(/(\w+)\[([^\]]+)\]/);
        if (match) {
          const [, prop, value] = match;
          switch (prop) {
            case 'min-h':
              cssProperties.push(`min-height: ${value}`);
              break;
            case 'w':
              cssProperties.push(`width: ${value}`);
              break;
            case 'h':
              cssProperties.push(`height: ${value}`);
              break;
            case 'p':
              cssProperties.push(`padding: ${value}`);
              break;
            case 'px':
              cssProperties.push(`padding-left: ${value}; padding-right: ${value}`);
              break;
            case 'py':
              cssProperties.push(`padding-top: ${value}; padding-bottom: ${value}`);
              break;
            case 'm':
              cssProperties.push(`margin: ${value}`);
              break;
            case 'mx':
              cssProperties.push(`margin-left: ${value}; margin-right: ${value}`);
              break;
            case 'my':
              cssProperties.push(`margin-top: ${value}; margin-bottom: ${value}`);
              break;
          }
        }
      }
    }
  });
  
  return cssProperties.join(';\n  ') + ';';
}

function fixApplyDirectives(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all @apply directives
    const applyRegex = /@apply\s+[^;]+;/g;
    const matches = content.match(applyRegex);
    
    if (!matches) {
      console.log('No @apply directives found in', filePath);
      return;
    }
    
    console.log(`Found ${matches.length} @apply directives in ${filePath}`);
    
    // Replace each @apply directive
    matches.forEach(match => {
      const css = convertApplyToCSS(match);
      content = content.replace(match, css);
    });
    
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${matches.length} @apply directives in ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Fix index.css
const indexPath = path.join(__dirname, '../src/index.css');
fixApplyDirectives(indexPath);

console.log('🎉 @apply directives fix completed!');
