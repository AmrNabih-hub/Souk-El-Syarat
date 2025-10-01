/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEFAULT_LANGUAGE: string;
  readonly VITE_SUPPORTED_LANGUAGES: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_EMULATORS: string;
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_ENABLE_REAL_TIME: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string;
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_USE_MOCK_AUTH: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_COGNITO_USER_POOL_ID: string;
  readonly VITE_AWS_COGNITO_CLIENT_ID: string;
  readonly VITE_AWS_COGNITO_IDENTITY_POOL_ID: string;
  readonly VITE_AWS_APPSYNC_GRAPHQL_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
