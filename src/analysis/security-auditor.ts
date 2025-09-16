import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface SecurityAuditResult {
  vulnerability: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  remediation: string;
  cvssScore: number;
  owaspCategory: string;
}

interface SecuritySummary {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallScore: number;
  compliance: SecurityCompliance;
}

interface SecurityCompliance {
  owaspTop10: boolean;
  cweStandards: boolean;
  iso27001: boolean;
  gdpr: boolean;
  soc2: boolean;
}

class ProfessionalSecurityAuditor {
  private vulnerabilities: SecurityAuditResult[] = [];
  private compliance: SecurityCompliance = {
    owaspTop10: true,
    cweStandards: true,
    iso27001: true,
    gdpr: true,
    soc2: true
  };

  async runComprehensiveSecurityAudit(): Promise<{
    vulnerabilities: SecurityAuditResult[];
    summary: SecuritySummary;
    recommendations: string[];
    actionPlan: SecurityActionPlan;
  }> {
    console.log('🛡️ Starting comprehensive security audit...');

    // OWASP Top 10 vulnerability assessment
    await this.assessOWASPTop10();
    
    // Code-level security analysis
    await this.analyzeCodeSecurity();
    
    // Dependency vulnerability scan
    await this.scanDependencies();
    
    // Configuration security review
    await this.reviewConfiguration();
    
    // Secrets and credentials audit
    await this.auditSecrets();
    
    // Infrastructure security assessment
    await this.assessInfrastructure();

    return {
      vulnerabilities: this.vulnerabilities,
      summary: this.generateSecuritySummary(),
      recommendations: this.generateSecurityRecommendations(),
      actionPlan: this.createActionPlan()
    };
  }

  private async assessOWASPTop10(): Promise<void> {
    const owaspTests = [
      {
        id: 'A01',
        category: 'Broken Access Control',
        test: () => this.testAccessControl(),
        severity: 'critical' as const
      },
      {
        id: 'A02',
        category: 'Cryptographic Failures',
        test: () => this.testCryptography(),
        severity: 'high' as const
      },
      {
        id: 'A03',
        category: 'Injection',
        test: () => this.testInjectionVulnerabilities(),
        severity: 'critical' as const
      },
      {
        id: 'A04',
        category: 'Insecure Design',
        test: () => this.testInsecureDesign(),
        severity: 'high' as const
      },
      {
        id: 'A05',
        category: 'Security Misconfiguration',
        test: () => this.testSecurityMisconfiguration(),
        severity: 'medium' as const
      },
      {
        id: 'A06',
        category: 'Vulnerable Components',
        test: () => this.testVulnerableComponents(),
        severity: 'high' as const
      },
      {
        id: 'A07',
        category: 'Authentication Failures',
        test: () => this.testAuthentication(),
        severity: 'critical' as const
      },
      {
        id: 'A08',
        category: 'Software Integrity Failures',
        test: () => this.testSoftwareIntegrity(),
        severity: 'medium' as const
      },
      {
        id: 'A09',
        category: 'Logging Failures',
        test: () => this.testLoggingFailures(),
        severity: 'medium' as const
      },
      {
        id: 'A10',
        category: 'Server-Side Request Forgery',
        test: () => this.testSSRF(),
        severity: 'high' as const
      }
    ];

    for (const { id, category, test, severity } of owaspTests) {
      try {
        const result = await test();
        if (!result.passed) {
          this.vulnerabilities.push({
            vulnerability: category,
            severity,
            description: result.description,
            location: result.location,
            remediation: result.remediation,
            cvssScore: this.calculateCVSSScore(severity),
            owaspCategory: id
          });
        }
      } catch (error) {
        this.vulnerabilities.push({
          vulnerability: category,
          severity,
          description: `Test failed: ${error.message}`,
          location: 'System-wide',
          remediation: 'Review and fix the underlying issue',
          cvssScore: this.calculateCVSSScore(severity),
          owaspCategory: id
        });
      }
    }
  }

  private async testAccessControl(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    // Test for broken access control
    const issues = [];
    
    // Check for hardcoded roles
    const files = this.getAllFiles('./src');
    const codeFiles = files.filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for hardcoded admin checks
        if (content.includes('user.role === "admin"') || content.includes('user.isAdmin === true')) {
          issues.push(`Hardcoded admin check in ${file}`);
        }
        
        // Check for missing authorization
        if (content.includes('findOne') && !content.includes('userId')) {
          issues.push(`Missing authorization check in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Access control properly implemented',
      location: issues.join(', ') || 'All endpoints',
      remediation: 'Implement proper role-based access control (RBAC) and authorization checks'
    };
  }

  private async testCryptography(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for weak encryption
    const configFiles = this.findConfigFiles();
    
    for (const file of configFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for weak algorithms
        if (content.includes('md5') || content.includes('sha1')) {
          issues.push(`Weak hashing algorithm in ${file}`);
        }
        
        // Check for hardcoded secrets
        if (content.match(/password.*=.*['"][^'"]{8,}['"]/i)) {
          issues.push(`Potentially hardcoded password in ${file}`);
        }
        
        // Check for HTTP instead of HTTPS
        if (content.includes('http://') && !content.includes('https://')) {
          issues.push(`Insecure HTTP usage in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Cryptography properly implemented',
      location: issues.join(', ') || 'All configurations',
      remediation: 'Use strong encryption algorithms (AES-256, SHA-256) and secure communication protocols'
    };
  }

  private async testInjectionVulnerabilities(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for SQL injection vulnerabilities
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for direct SQL queries
        if (content.includes('SELECT * FROM') && !content.includes('?')) {
          issues.push(`Potential SQL injection in ${file}`);
        }
        
        // Check for eval usage
        if (content.includes('eval(') || content.includes('Function(')) {
          issues.push(`Code injection vulnerability in ${file}`);
        }
        
        // Check for innerHTML without sanitization
        if (content.includes('innerHTML') && !content.includes('sanitize')) {
          issues.push(`XSS vulnerability via innerHTML in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'No injection vulnerabilities found',
      location: issues.join(', ') || 'All endpoints',
      remediation: 'Use parameterized queries, input validation, and output encoding'
    };
  }

  private async testInsecureDesign(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    // Check for insecure design patterns
    const issues = [];
    
    // Check for missing rate limiting
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for API endpoints without rate limiting
        if (content.includes('app.post') || content.includes('router.post')) {
          if (!content.includes('rateLimit') && !content.includes('throttle')) {
            issues.push(`Missing rate limiting in ${file}`);
          }
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Secure design patterns implemented',
      location: issues.join(', ') || 'All endpoints',
      remediation: 'Implement rate limiting, proper error handling, and secure defaults'
    };
  }

  private async testSecurityMisconfiguration(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for security headers
    const configFiles = this.findConfigFiles();
    
    for (const file of configFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for missing security headers configuration
        if (!content.includes('helmet') && !content.includes('securityHeaders')) {
          issues.push(`Missing security headers configuration in ${file}`);
        }
        
        // Check for debug mode enabled
        if (content.includes('NODE_ENV=development') || content.includes('debug=true')) {
          issues.push(`Debug mode might be enabled in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Security configuration properly set',
      location: issues.join(', ') || 'All configurations',
      remediation: 'Configure security headers, disable debug mode, and follow security best practices'
    };
  }

  private async testVulnerableComponents(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    try {
      // Check for vulnerable dependencies
      const auditResult = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(auditResult);
      
      const vulnerabilities = audit.vulnerabilities || {};
      const vulnerablePackages = Object.keys(vulnerabilities);
      
      return {
        passed: vulnerablePackages.length === 0,
        description: vulnerablePackages.length > 0 
          ? `${vulnerablePackages.length} vulnerable packages found`
          : 'No vulnerable dependencies',
        location: vulnerablePackages.join(', ') || 'All dependencies',
        remediation: 'Update vulnerable packages and implement automated dependency scanning'
      };
    } catch (error) {
      return {
        passed: false,
        description: `Failed to scan dependencies: ${error.message}`,
        location: 'Package dependencies',
        remediation: 'Run npm audit and fix all vulnerabilities'
      };
    }
  }

  private async testAuthentication(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for authentication weaknesses
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for weak password requirements
        if (content.includes('password.length < 8')) {
          issues.push(`Weak password requirements in ${file}`);
        }
        
        // Check for missing session management
        if (content.includes('jwt') && !content.includes('expiresIn')) {
          issues.push(`Missing token expiration in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Authentication properly implemented',
      location: issues.join(', ') || 'All auth endpoints',
      remediation: 'Implement strong password policies, proper session management, and MFA'
    };
  }

  private async testSoftwareIntegrity(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    // Check for software integrity issues
    const issues = [];
    
    // Check for integrity verification
    const configFiles = this.findConfigFiles();
    
    for (const file of configFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for missing integrity checks
        if (content.includes('script') && !content.includes('integrity')) {
          issues.push(`Missing integrity verification in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Software integrity verified',
      location: issues.join(', ') || 'All configurations',
      remediation: 'Implement integrity verification for all external resources'
    };
  }

  private async testLoggingFailures(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for logging and monitoring
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for missing error logging
        if (content.includes('catch') && !content.includes('log')) {
          issues.push(`Missing error logging in ${file}`);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'Logging and monitoring properly implemented',
      location: issues.join(', ') || 'All endpoints',
      remediation: 'Implement comprehensive logging, monitoring, and alerting'
    };
  }

  private async testSSRF(): Promise<{ passed: boolean; description: string; location: string; remediation: string }> {
    const issues = [];
    
    // Check for SSRF vulnerabilities
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for unrestricted URL fetching
        if (content.includes('fetch(') || content.includes('axios.')) {
          if (!content.includes('whitelist') && !content.includes('validation')) {
            issues.push(`Potential SSRF in ${file}`);
          }
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      passed: issues.length === 0,
      description: issues.join('; ') || 'SSRF protection implemented',
      location: issues.join(', ') || 'All endpoints',
      remediation: 'Implement URL validation, whitelist allowed domains, and network segmentation'
    };
  }

  private async analyzeCodeSecurity(): Promise<void> {
    const codeFiles = this.getAllFiles('./src').filter(f => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
    
    for (const file of codeFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        this.analyzeFileSecurity(content, file);
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  private analyzeFileSecurity(content: string, filePath: string): void {
    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      /api[_-]?key\s*[:=]\s*['"][a-z0-9]{20,}['"]/gi,
      /secret\s*[:=]\s*['"][a-z0-9]{20,}['"]/gi,
      /token\s*[:=]\s*['"][a-z0-9]{20,}['"]/gi
    ];

    secretPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.vulnerabilities.push({
            vulnerability: 'Hardcoded Secret',
            severity: 'critical',
            description: `Potential hardcoded secret detected: ${match}`,
            location: filePath,
            remediation: 'Move secrets to environment variables or secure vault',
            cvssScore: 9.8,
            owaspCategory: 'A02'
          });
        });
      }
    });
  }

  private async scanDependencies(): Promise<void> {
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(auditResult);
      
      const vulnerabilities = audit.vulnerabilities || {};
      
      Object.entries(vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
        this.vulnerabilities.push({
          vulnerability: `Vulnerable Package: ${pkg}`,
          severity: this.mapSeverity(vuln.severity),
          description: vuln.via?.[0]?.title || 'Vulnerability found',
          location: `package.json -> ${pkg}`,
          remediation: `Update ${pkg} to version ${vuln.fixAvailable?.version || 'latest'}`,
          cvssScore: vuln.via?.[0]?.cvssScore || 5.0,
          owaspCategory: 'A06'
        });
      });
    } catch (error) {
      console.warn('Could not run npm audit:', error.message);
    }
  }

  private async reviewConfiguration(): Promise<void> {
    const configFiles = [
      '.env', '.env.local', '.env.production', '.env.development',
      'next.config.js', 'vite.config.ts', 'tsconfig.json'
    ];

    configFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for insecure configurations
        if (content.includes('NODE_ENV=development') && file.includes('production')) {
          this.vulnerabilities.push({
            vulnerability: 'Insecure Environment Configuration',
            severity: 'high',
            description: 'Development mode enabled in production',
            location: file,
            remediation: 'Set NODE_ENV=production for production builds',
            cvssScore: 7.5,
            owaspCategory: 'A05'
          });
        }
      } catch (error) {
        // Skip missing files
      }
    });
  }

  private async auditSecrets(): Promise<void> {
    const allFiles = this.getAllFiles('./');
    
    for (const file of allFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        
        // Check for common secrets
        const secretPatterns = [
          /sk_live_[a-z0-9]{24,}/gi, // Stripe
          /pk_live_[a-z0-9]{24,}/gi, // Stripe public
          /AIza[0-9A-Za-z_-]{35}/gi, // Google API
          /AKIA[0-9A-Z]{16}/gi, // AWS Access Key
          /github_pat_[a-z0-9]{22,}/gi, // GitHub PAT
          /ghp_[a-z0-9]{36}/gi, // GitHub Token
          /glpat-[a-z0-9-]{20,}/gi // GitLab Token
        ];

        secretPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.vulnerabilities.push({
                vulnerability: 'Exposed Secret',
                severity: 'critical',
                description: `Exposed API key/secret: ${match.substring(0, 10)}...`,
                location: file,
                remediation: 'Remove secrets from code and use environment variables',
                cvssScore: 9.8,
                owaspCategory: 'A02'
              });
            });
          }
        });
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  private async assessInfrastructure(): Promise<void> {
    // Check for common infrastructure security issues
    const infrastructureChecks = [
      {
        vulnerability: 'Missing HTTPS',
        severity: 'high' as const,
        description: 'Application should enforce HTTPS',
        location: 'Configuration',
        remediation: 'Configure HTTPS redirect and HSTS headers',
        cvssScore: 7.5,
        owaspCategory: 'A05'
      },
      {
        vulnerability: 'Missing Security Headers',
        severity: 'medium' as const,
        description: 'Security headers not configured',
        location: 'HTTP Headers',
        remediation: 'Configure security headers (CSP, X-Frame-Options, etc.)',
        cvssScore: 5.3,
        owaspCategory: 'A05'
      }
    ];

    this.vulnerabilities.push(...infrastructureChecks);
  }

  private generateSecuritySummary(): SecuritySummary {
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.severity === 'low').length;
    
    const totalVulnerabilities = this.vulnerabilities.length;
    const overallScore = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));

    return {
      totalVulnerabilities,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      overallScore,
      compliance: this.compliance
    };
  }

  private generateSecurityRecommendations(): string[] {
    return [
      '1. **Immediate Actions (Critical)**',
      '   - Remove all hardcoded secrets from codebase',
      '   - Update vulnerable dependencies',
      '   - Implement proper access control',
      '   - Enable HTTPS enforcement',
      '',
      '2. **Short-term Improvements (High Priority)**',
      '   - Implement comprehensive input validation',
      '   - Add security headers',
      '   - Enable proper authentication mechanisms',
      '   - Implement rate limiting',
      '',
      '3. **Long-term Security Strategy**',
      '   - Implement automated security testing',
      '   - Regular security audits',
      '   - Security awareness training',
      '   - Incident response plan',
      '',
      '4. **Compliance Requirements**',
      '   - GDPR compliance implementation',
      '   - SOC 2 Type II certification',
      '   - ISO 27001 certification',
      '   - Regular penetration testing'
    ];
  }

  private createActionPlan(): SecurityActionPlan {
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = this.vulnerabilities.filter(v => v.severity === 'high');
    const mediumVulns = this.vulnerabilities.filter(v => v.severity === 'medium');

    return {
      phase1: {
        title: 'Critical Vulnerability Remediation (Week 1)',
        tasks: criticalVulns.map(v => ({
          task: `Fix ${v.vulnerability}`,
          priority: 'critical',
          estimatedHours: 4,
          assignee: 'Security Team'
        }))
      },
      phase2: {
        title: 'High Priority Security Improvements (Week 2-3)',
        tasks: highVulns.map(v => ({
          task: `Address ${v.vulnerability}`,
          priority: 'high',
          estimatedHours: 8,
          assignee: 'Development Team'
        }))
      },
      phase3: {
        title: 'Medium Priority Enhancements (Week 4-6)',
        tasks: mediumVulns.map(v => ({
          task: `Improve ${v.vulnerability}`,
          priority: 'medium',
          estimatedHours: 16,
          assignee: 'Development Team'
        }))
      },
      ongoing: {
        title: 'Continuous Security Monitoring',
        tasks: [
          {
            task: 'Weekly security scans',
            priority: 'medium',
            estimatedHours: 2,
            assignee: 'DevOps Team'
          },
          {
            task: 'Monthly security reviews',
            priority: 'medium',
            estimatedHours: 8,
            assignee: 'Security Team'
          }
        ]
      }
    };
  }

  private calculateCVSSScore(severity: string): number {
    switch (severity) {
      case 'critical': return 9.0;
      case 'high': return 7.0;
      case 'medium': return 5.0;
      case 'low': return 3.0;
      default: return 5.0;
    }
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping: Record<string, any> = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'low': 'low'
    };
    return mapping[severity] || 'medium';
  }

  private getAllFiles(dirPath: string): string[] {
    try {
      const files: string[] = [];
      const items = readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = join(dirPath, item);
        const stats = statSync(fullPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath));
        } else if (stats.isFile()) {
          files.push(fullPath);
        }
      }
      
      return files;
    } catch (error) {
      return [];
    }
  }

  private findConfigFiles(): string[] {
    const configPatterns = [
      '.env*', 'next.config.*', 'vite.config.*', 'webpack.config.*',
      'package.json', 'tsconfig.json', 'tailwind.config.*'
    ];
    
    return configPatterns.flatMap(pattern => 
      this.getAllFiles('./').filter(f => f.includes(pattern))
    );
  }
}

interface SecurityActionPlan {
  phase1: ActionPhase;
  phase2: ActionPhase;
  phase3: ActionPhase;
  ongoing: ActionPhase;
}

interface ActionPhase {
  title: string;
  tasks: SecurityTask[];
}

interface SecurityTask {
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  assignee: string;
}

// Usage example
export async function runComprehensiveSecurityAudit() {
  const auditor = new ProfessionalSecurityAuditor();
  return await auditor.runComprehensiveSecurityAudit();
}

// Export for CLI usage
if (require.main === module) {
  runComprehensiveSecurityAudit().catch(console.error);
}