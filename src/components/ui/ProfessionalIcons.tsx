import React from 'react';

// Professional Automotive Icons - SVG Components
export const LuxuryCarIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5S16.67 13 17.5 13 19 13.67 19 14.5 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z'
      fill='currentColor'
    />
  </svg>
);

export const PremiumEngineIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 2L13.09 8.26L19 7L17.74 13.09L22 15L16.74 16.91L17 23L10.91 21.74L9 22L7.09 15.74L2 17L3.26 10.91L2 9L8.26 7.09L7 2L13.09 3.26L12 2Z'
      stroke='currentColor'
      strokeWidth='1.5'
      fill='none'
    />
    <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='1.5' fill='none' />
  </svg>
);

export const LuxuryServiceIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 2L15.5 8.5L22 9L17 14L18.5 22L12 18.5L5.5 22L7 14L2 9L8.5 8.5L12 2Z'
      fill='currentColor'
    />
  </svg>
);

export const ProfessionalToolIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z'
      fill='currentColor'
    />
  </svg>
);

export const PremiumShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 1L21 5V11C21 16.55 17.16 21.74 12 23C6.84 21.74 3 16.55 3 11V5L12 1ZM12 7C10.9 7 10 7.9 10 9S10.9 11 12 11 14 10.1 14 9 13.1 7 12 7ZM18 9C18 13.05 15.82 16.67 12.5 18.37C12.19 18.52 11.81 18.52 11.5 18.37C8.18 16.67 6 13.05 6 9V6.3L12 3.18L18 6.3V9Z'
      fill='currentColor'
    />
  </svg>
);

export const EliteVerificationIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V4.5C15 3.57 14.43 2.75 13.6 2.4L12 1.75L10.4 2.4C9.57 2.75 9 3.57 9 4.5V6.5L3 7V9L9 8.5V21H11V14H13V21H15V8.5L21 9Z'
      fill='currentColor'
    />
    <circle cx='12' cy='4' r='1' fill='white' />
  </svg>
);

export const ProfessionalSearchIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' fill='none' />
    <path d='m21 21-4.35-4.35' stroke='currentColor' strokeWidth='2' />
    <circle cx='11' cy='11' r='3' stroke='currentColor' strokeWidth='1' fill='none' />
  </svg>
);

export const LuxuryWheelIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' fill='none' />
    <circle cx='12' cy='12' r='6' stroke='currentColor' strokeWidth='1.5' fill='none' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <path d='M12 2v4M12 18v4M22 12h-4M6 12H2' stroke='currentColor' strokeWidth='1' />
    <path
      d='M18.36 5.64l-2.83 2.83M8.47 15.53l-2.83 2.83M18.36 18.36l-2.83-2.83M8.47 8.47L5.64 5.64'
      stroke='currentColor'
      strokeWidth='1'
    />
  </svg>
);

export const PremiumGearIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z'
      fill='currentColor'
    />
  </svg>
);
