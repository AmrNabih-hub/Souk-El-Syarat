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

// Add global type declarations
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    VITE_APP_AWS_REGION: string;
    VITE_APP_USER_POOL_ID: string;
    VITE_APP_USER_POOL_WEB_CLIENT_ID: string;
    VITE_APP_IDENTITY_POOL_ID: string;
    VITE_APP_API_ENDPOINT: string;
  }
}

// Add global variables
declare const process: {
  env: NodeJS.ProcessEnv;
  browser: boolean;
};

declare const global: typeof globalThis & {
  process: typeof process;
};
