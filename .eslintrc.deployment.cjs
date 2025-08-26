module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs', 
    'node_modules', 
    'build', 
    'coverage',
    '*.config.js',
    '*.config.ts',
    '.github',
    'dataconnect-generated'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'react-refresh'
      ],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
        'prefer-const': 'error',
        'no-var': 'error',
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-unused-vars': 'off',
        // Deployment-optimized rules
        '@typescript-eslint/no-unused-vars': 'warn',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/display-name': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-fallthrough': 'warn',
        'no-undef': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
  ],
}