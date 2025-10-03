// Add type declarations for Node.js built-in modules
declare module 'crypto' {
  const content: any;
  export default content;
}

declare module 'stream' {
  const content: any;
  export default content;
}

declare module 'path' {
  const content: any;
  export default content;
}

declare module 'fs' {
  const content: any;
  export default content;
}

declare module 'os' {
  const content: any;
  export default content;
}

// Global type declarations for Appwrite-powered marketplace
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    VITE_APPWRITE_ENDPOINT: string;
    VITE_APPWRITE_PROJECT_ID: string;
    VITE_APPWRITE_DATABASE_ID: string;
  }
}

// Global variables
declare const process: {
  env: NodeJS.ProcessEnv;
  browser: boolean;
};

declare const global: typeof globalThis & {
  process: typeof process;
};

// Appwrite SDK declarations
declare module 'appwrite' {
  export * from 'appwrite';
}
