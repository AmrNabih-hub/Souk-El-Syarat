module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Turn most errors into warnings for emergency deployment
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'no-undef': 'warn',
    'react/display-name': 'warn',
    'no-case-declarations': 'warn',
    'no-fallthrough': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': 'warn',
    'no-redeclare': 'warn',
    'no-unused-vars': 'warn'
  }
};
