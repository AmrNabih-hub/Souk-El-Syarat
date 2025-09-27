Write-Host "🚀 Starting Souk El-Sayarat Environment Fix Script..." -ForegroundColor Cyan

# Function to check if a command was successful
function Test-CommandStatus {
    param([string]$CommandName)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error in $CommandName" -ForegroundColor Red
        exit $LASTEXITCODE
    } else {
        Write-Host "✅ $CommandName completed successfully" -ForegroundColor Green
    }
}

# 1. Stop any running Node processes
Write-Host "🛑 Stopping any running Node processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Clean up previous installations
Write-Host "🧹 Cleaning up previous installations..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force

# 3. Fix configuration files
Write-Host "🔧 Fixing configuration files..." -ForegroundColor Yellow

# Fix postcss.config.js
@"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@ | Out-File -FilePath "postcss.config.js" -Force

# Fix tailwind.config.js
@"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
    },
  },
  plugins: [],
}
"@ | Out-File -FilePath "tailwind.config.js" -Force

# Create styles directory if it doesn't exist
$stylesDir = "src\styles"
if (-not (Test-Path -Path $stylesDir)) {
    New-Item -Path $stylesDir -ItemType Directory -Force | Out-Null
}

# Fix tailwind-directives.css
@"
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom components */
@layer components {
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
"@ | Out-File -FilePath "src\styles\tailwind-directives.css" -Force

# 4. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
Test-CommandStatus -CommandName "npm install"

# 5. Install required development dependencies
Write-Host "🔧 Installing development dependencies..." -ForegroundColor Yellow
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/react-hooks @tanstack/react-query
Test-CommandStatus -CommandName "dev dependencies installation"

# 6. Create test directory if it doesn't exist
$testDir = "src\test"
if (-not (Test-Path -Path $testDir)) {
    New-Item -Path $testDir -ItemType Directory -Force | Out-Null
}

# Create test-utils.ts
@"
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { BrowserRouter } from "react-router-dom";

const TestProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

export const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: TestProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
"@ | Out-File -FilePath "$testDir\test-utils.ts" -Force

# Create test-utils.tsx
@"
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const TestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult => render(ui, { wrapper: TestProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
"@ | Out-File -FilePath "$testDir\test-utils.tsx" -Force

# 7. Create global.d.ts
@"
// Add type declarations for Node.js built-in modules
declare module "crypto" {
  const content: any;
  export default content;
}

declare module "stream" {
  const content: any;
  export default content;
}

declare module "path" {
  const content: any;
  export default content;
}

declare module "fs" {
  const content: any;
  export default content;
}

declare module "os" {
  const content: any;
  export default content;
}

// Add global type declarations
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
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
"@ | Out-File -FilePath "src\global.d.ts" -Force

# 8. Create .env file if it doesn't exist
if (-not (Test-Path -Path ".env")) {
    @"
# Environment Variables
NODE_ENV=development
VITE_APP_AWS_REGION=your_region
VITE_APP_USER_POOL_ID=your_user_pool_id
VITE_APP_USER_POOL_WEB_CLIENT_ID=your_web_client_id
VITE_APP_IDENTITY_POOL_ID=your_identity_pool_id
VITE_APP_API_ENDPOINT=your_api_endpoint
"@ | Out-File -FilePath ".env" -Force
    Write-Host "ℹ️  Created .env file. Please update it with your actual values." -ForegroundColor Yellow
}

# 9. Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
Write-Host "   Please wait, this might take a moment..." -ForegroundColor Cyan

# Run npm run dev
npm run dev

Write-Host ""
Write-Host "✨ Environment setup complete!" -ForegroundColor Green
Write-Host "   The development server should be starting now." -ForegroundColor Green
Write-Host "   If you encounter any issues, please check the logs above." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env file with your actual AWS credentials" -ForegroundColor Cyan
Write-Host "2. Check the development server output for any additional instructions" -ForegroundColor Cyan
Write-Host "3. If you see any errors, please share them for further assistance" -ForegroundColor Cyan