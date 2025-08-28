// Global type declarations
declare module '@/services/*';
declare module '@/stores/*';
declare module '@/components/*';

// Fix for window extensions
interface Window {
  gtag?: Function;
  ethereum?: any;
}

// Fix for missing types
declare type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
