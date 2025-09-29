# Development Rules & Best Practices

## Code Quality Standards

### 1. TypeScript Requirements
- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: No `any` types unless absolutely necessary
- **Interface Definitions**: Define interfaces for all data structures
- **Error Handling**: Proper try-catch blocks with typed errors

### 2. Component Guidelines
- **Single Responsibility**: One component per file, one responsibility per component
- **Props Interface**: Always define props interfaces
- **Default Props**: Use default parameters instead of defaultProps
- **Error Boundaries**: Implement error boundaries for critical components

### 3. State Management
- **Zustand**: Use Zustand for global state
- **Local State**: Use useState for component-specific state
- **Side Effects**: Use useEffect with proper cleanup
- **Memoization**: Use useMemo and useCallback for performance

## Error Prevention Rules

### 1. AWS Amplify Best Practices
- **Modular Imports**: Use `import { function } from 'aws-amplify/service'`
- **Error Handling**: Wrap all Amplify calls in try-catch blocks
- **Environment Checks**: Check for production vs development environments
- **Graceful Degradation**: Provide fallbacks for missing services

### 2. Package Management
- **Lock Files**: Always commit package-lock.json
- **Version Pinning**: Pin major versions to prevent breaking changes
- **Security Updates**: Regular `npm audit` and updates
- **Dependency Review**: Review all new dependencies before adding

### 3. Build & Deployment
- **Build Verification**: Test production builds locally before deployment
- **Environment Variables**: Use proper environment variable validation
- **Error Monitoring**: Implement proper error logging and monitoring
- **Performance**: Monitor bundle size and performance metrics

## Testing Requirements

### 1. Unit Tests
- **Coverage**: Minimum 80% code coverage
- **Critical Paths**: 100% coverage for authentication and payment flows
- **Mock External Services**: Mock all AWS Amplify calls in tests
- **Test Data**: Use factory patterns for test data generation

### 2. Integration Tests
- **API Integration**: Test all API integrations
- **User Flows**: Test complete user journeys
- **Cross-browser**: Test on Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Test responsive behavior on mobile devices

### 3. E2E Tests
- **Critical Flows**: Authentication, product purchase, vendor registration
- **Performance Testing**: Page load times under 3 seconds
- **Accessibility**: WCAG 2.1 AA compliance
- **Security Testing**: Input validation and XSS prevention

## Performance Standards

### 1. Core Web Vitals
- **LCP**: Largest Contentful Paint < 2.5s
- **FID**: First Input Delay < 100ms
- **CLS**: Cumulative Layout Shift < 0.1
- **Bundle Size**: Total bundle < 1MB gzipped

### 2. Optimization Techniques
- **Code Splitting**: Lazy load non-critical components
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Implement proper cache headers
- **CDN Usage**: Use CDN for static assets

## Security Guidelines

### 1. Authentication
- **Secure Tokens**: Use secure, httpOnly cookies where possible
- **Role Validation**: Server-side role validation for all operations
- **Session Management**: Proper session timeout and renewal
- **Multi-Factor**: Support for MFA where appropriate

### 2. Data Protection
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries (GraphQL)
- **XSS Prevention**: Sanitize all user-generated content
- **HTTPS Only**: Enforce HTTPS in production

### 3. API Security
- **Rate Limiting**: Implement rate limiting on all APIs
- **CORS Configuration**: Proper CORS setup
- **API Keys**: Secure API key management
- **Audit Logging**: Log all security-relevant events

## Package Update Protocol

### 1. Regular Updates
- **Weekly Check**: Check for dependency updates weekly
- **Security Updates**: Apply security updates immediately
- **Major Version Updates**: Test thoroughly before applying
- **Breaking Changes**: Document all breaking changes

### 2. Update Process
1. Run `npm audit` to check for vulnerabilities
2. Update dependencies with `npm update`
3. Test all functionality after updates
4. Run full test suite
5. Check build process
6. Deploy to staging environment
7. Perform integration testing
8. Deploy to production

### 3. Version Management
- **Semantic Versioning**: Follow semver for all packages
- **Lock File Updates**: Commit updated lock files
- **Rollback Plan**: Have rollback strategy for failed updates
- **Documentation**: Document all significant updates

## Error Handling Protocols

### 1. Development Environment
- **Console Logging**: Detailed console logging for debugging
- **Error Boundaries**: React error boundaries for graceful degradation
- **Hot Reload**: Preserve error states during hot reload
- **Source Maps**: Enable source maps for debugging

### 2. Production Environment
- **Error Monitoring**: Use error monitoring service (Sentry)
- **User-Friendly Messages**: Display helpful error messages to users
- **Fallback UI**: Provide fallback UI for broken components
- **Recovery Options**: Offer users ways to recover from errors

### 3. Monitoring & Alerting
- **Performance Monitoring**: Track core web vitals
- **Error Rate Monitoring**: Alert on error rate spikes
- **Uptime Monitoring**: Monitor application availability
- **User Experience Tracking**: Monitor user satisfaction metrics

## Code Review Standards

### 1. Pre-Review Checklist
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented
- [ ] Documentation updated if needed

### 2. Review Focus Areas
- **Security**: Check for security vulnerabilities
- **Performance**: Identify performance bottlenecks
- **Accessibility**: Ensure accessibility compliance
- **Maintainability**: Code is readable and maintainable
- **Testing**: Adequate test coverage

### 3. Post-Review Actions
- **Address Feedback**: Implement all review feedback
- **Re-test**: Run tests after making changes
- **Update Documentation**: Update docs if needed
- **Monitor Deployment**: Monitor after deployment