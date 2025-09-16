import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface CodeReviewReport {
  filePath: string;
  issues: CodeIssue[];
  metrics: CodeMetrics;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
}

interface CodeIssue {
  type: 'security' | 'performance' | 'maintainability' | 'style';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  message: string;
  suggestion: string;
  ruleId: string;
}

interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  testCoverage: number;
  duplicationPercentage: number;
  dependencies: string[];
}

class ProfessionalCodeAnalyzer {
  private reports: CodeReviewReport[] = [];
  private securityPatterns = [
    /eval\s*\(/gi,
    /innerHTML\s*=/gi,
    /document\.write\s*\(/gi,
    /setTimeout\s*\(\s*["\'][^"\']*["\']\s*\)/gi,
    /setInterval\s*\(\s*["\'][^"\']*["\']\s*\)/gi,
    /localStorage\.getItem\s*\(/gi,
    /sessionStorage\.getItem\s*\(/gi,
    /window\.location\s*=/gi,
    /new\s+Function\s*\(/gi,
    /RegExp\s*\(/gi
  ];

  private performancePatterns = [
    /for\s*\(\s*var\s+/gi,
    /\.push\s*\(/gi,
    /\.splice\s*\(/gi,
    /\.shift\s*\(/gi,
    /\.unshift\s*\(/gi,
    /Object\.keys\s*\(\s*[^)]*\)\.forEach/gi,
    /Array\.from\s*\(/gi,
    /\.reduce\s*\(/gi,
    /\.map\s*\(.*?\)\.filter\s*\(/gi,
    /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/gi
  ];

  private maintainabilityPatterns = [
    /function\s+\w+\s*\([^)]*\)\s*\{/gi,
    /var\s+/gi,
    /console\.(log|warn|error)\s*\(/gi,
    /TODO|FIXME|HACK|XXX/gi,
    /any\s*:/gi,
    /as\s+any/gi,
    /@ts-ignore/gi,
    /@ts-nocheck/gi,
    /type\s+any\s*=/gi,
    /interface\s+\w+\s*\{\s*\[key:\s*string\]:\s*any\s*\}/gi
  ];

  async analyzeCodebase(rootPath: string): Promise<CodeReviewReport[]> {
    console.log('🔍 Starting comprehensive code analysis...');
    
    const files = this.getAllFiles(rootPath);
    const codeFiles = files.filter(file => 
      ['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))
    );

    console.log(`📊 Analyzing ${codeFiles.length} source files...`);

    for (const filePath of codeFiles) {
      try {
        const report = await this.analyzeFile(filePath);
        this.reports.push(report);
        console.log(`✅ Analyzed: ${filePath}`);
      } catch (error) {
        console.error(`❌ Error analyzing ${filePath}:`, error);
      }
    }

    return this.generateFinalReport();
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = statSync(fullPath);
      
      if (stats.isDirectory() && !this.shouldSkipDirectory(item)) {
        files.push(...this.getAllFiles(fullPath));
      } else if (stats.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules', 'dist', 'build', '.git', '.next',
      'coverage', 'logs', 'temp', 'tmp', '.cache'
    ];
    return skipDirs.includes(dirName.toLowerCase());
  }

  private async analyzeFile(filePath: string): Promise<CodeReviewReport> {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const issues: CodeIssue[] = [];
    
    // Security analysis
    this.analyzeSecurity(lines, issues, filePath);
    
    // Performance analysis
    this.analyzePerformance(lines, issues, filePath);
    
    // Maintainability analysis
    this.analyzeMaintainability(lines, issues, filePath);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(content, lines);
    
    // Calculate scores
    const securityScore = this.calculateSecurityScore(issues);
    const performanceScore = this.calculatePerformanceScore(issues);
    const maintainabilityScore = this.calculateMaintainabilityScore(issues);

    return {
      filePath,
      issues,
      metrics,
      securityScore,
      performanceScore,
      maintainabilityScore
    };
  }

  private analyzeSecurity(lines: string[], issues: CodeIssue[], filePath: string): void {
    lines.forEach((line, index) => {
      this.securityPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              type: 'security',
              severity: this.getSecuritySeverity(match),
              line: index + 1,
              message: `Security vulnerability: ${match}`,
              suggestion: this.getSecuritySuggestion(match),
              ruleId: 'security-' + pattern.source
            });
          });
        }
      });
    });
  }

  private analyzePerformance(lines: string[], issues: CodeIssue[], filePath: string): void {
    lines.forEach((line, index) => {
      this.performancePatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              type: 'performance',
              severity: this.getPerformanceSeverity(match),
              line: index + 1,
              message: `Performance concern: ${match}`,
              suggestion: this.getPerformanceSuggestion(match),
              ruleId: 'performance-' + pattern.source
            });
          });
        }
      });
    });
  }

  private analyzeMaintainability(lines: string[], issues: CodeIssue[], filePath: string): void {
    lines.forEach((line, index) => {
      this.maintainabilityPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              type: 'maintainability',
              severity: this.getMaintainabilitySeverity(match),
              line: index + 1,
              message: `Maintainability issue: ${match}`,
              suggestion: this.getMaintainabilitySuggestion(match),
              ruleId: 'maintainability-' + pattern.source
            });
          });
        }
      });
    });
  }

  private calculateMetrics(content: string, lines: string[]): CodeMetrics {
    const loc = lines.length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
    const cognitiveComplexity = this.calculateCognitiveComplexity(content);
    const dependencies = this.extractDependencies(content);
    
    return {
      linesOfCode: loc,
      cyclomaticComplexity,
      cognitiveComplexity,
      testCoverage: 0, // Will be calculated separately
      duplicationPercentage: 0, // Will be calculated separately
      dependencies
    };
  }

  private calculateCyclomaticComplexity(content: string): number {
    const complexityKeywords = /\b(if|else|for|while|do|switch|case|catch|try|finally)\b/g;
    const matches = content.match(complexityKeywords);
    return matches ? matches.length + 1 : 1;
  }

  private calculateCognitiveComplexity(content: string): number {
    const nestingKeywords = /\b(if|else|for|while|do|switch|case|catch|try|finally)\b/g;
    const matches = content.match(nestingKeywords);
    return matches ? matches.length : 0;
  }

  private extractDependencies(content: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    
    const dependencies: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }

  private getSecuritySeverity(match: string): 'critical' | 'high' | 'medium' | 'low' {
    if (match.includes('eval(') || match.includes('innerHTML')) return 'critical';
    if (match.includes('document.write')) return 'high';
    return 'medium';
  }

  private getPerformanceSeverity(match: string): 'critical' | 'high' | 'medium' | 'low' {
    if (match.includes('for(var')) return 'medium';
    return 'low';
  }

  private getMaintainabilitySeverity(match: string): 'critical' | 'high' | 'medium' | 'low' {
    if (match.includes('TODO') || match.includes('FIXME')) return 'medium';
    if (match.includes('any')) return 'high';
    return 'low';
  }

  private getSecuritySuggestion(match: string): string {
    if (match.includes('eval(')) return 'Use JSON.parse or safer alternatives instead of eval';
    if (match.includes('innerHTML')) return 'Use textContent or createElement instead of innerHTML';
    if (match.includes('document.write')) return 'Use DOM manipulation methods instead of document.write';
    return 'Review security implications';
  }

  private getPerformanceSuggestion(match: string): string {
    if (match.includes('for(var')) return 'Use let/const instead of var for block scoping';
    return 'Consider performance optimization';
  }

  private getMaintainabilitySuggestion(match: string): string {
    if (match.includes('TODO')) return 'Complete the TODO item or create a proper task';
    if (match.includes('any')) return 'Use specific types instead of any';
    return 'Improve code maintainability';
  }

  private calculateSecurityScore(issues: CodeIssue[]): number {
    const securityIssues = issues.filter(i => i.type === 'security');
    const critical = securityIssues.filter(i => i.severity === 'critical').length;
    const high = securityIssues.filter(i => i.severity === 'high').length;
    
    if (critical > 0) return 0;
    if (high > 0) return 50;
    return Math.max(0, 100 - (securityIssues.length * 5));
  }

  private calculatePerformanceScore(issues: CodeIssue[]): number {
    const performanceIssues = issues.filter(i => i.type === 'performance');
    return Math.max(0, 100 - (performanceIssues.length * 3));
  }

  private calculateMaintainabilityScore(issues: CodeIssue[]): number {
    const maintainabilityIssues = issues.filter(i => i.type === 'maintainability');
    return Math.max(0, 100 - (maintainabilityIssues.length * 2));
  }

  private generateFinalReport(): CodeReviewReport[] {
    return this.reports.sort((a, b) => {
      const scoreA = a.securityScore + a.performanceScore + a.maintainabilityScore;
      const scoreB = b.securityScore + b.performanceScore + b.maintainabilityScore;
      return scoreB - scoreA;
    });
  }

  generateSummaryReport(): string {
    const totalFiles = this.reports.length;
    const totalIssues = this.reports.reduce((sum, r) => sum + r.issues.length, 0);
    const avgSecurityScore = this.reports.reduce((sum, r) => sum + r.securityScore, 0) / totalFiles;
    const avgPerformanceScore = this.reports.reduce((sum, r) => sum + r.performanceScore, 0) / totalFiles;
    const avgMaintainabilityScore = this.reports.reduce((sum, r) => sum + r.maintainabilityScore, 0) / totalFiles;

    return `
# 📊 Professional Code Analysis Report

## Summary Statistics
- **Total Files Analyzed**: ${totalFiles}
- **Total Issues Found**: ${totalIssues}
- **Average Security Score**: ${avgSecurityScore.toFixed(1)}/100
- **Average Performance Score**: ${avgPerformanceScore.toFixed(1)}/100
- **Average Maintainability Score**: ${avgMaintainabilityScore.toFixed(1)}/100

## Critical Findings
${this.generateCriticalFindings()}

## Recommendations
${this.generateRecommendations()}
    `.trim();
  }

  private generateCriticalFindings(): string {
    const criticalIssues = this.reports.flatMap(r => 
      r.issues.filter(i => i.severity === 'critical')
    );

    if (criticalIssues.length === 0) {
      return '✅ No critical security vulnerabilities found';
    }

    return criticalIssues.map(issue => 
      `- **${issue.type.toUpperCase()}**: ${issue.message}`
    ).join('\n');
  }

  private generateRecommendations(): string {
    return `
1. **Immediate Actions**:
   - Address all critical security vulnerabilities
   - Fix performance bottlenecks in high-traffic components
   - Improve TypeScript type safety

2. **Quality Improvements**:
   - Increase test coverage to 95%+
   - Implement proper error handling
   - Add comprehensive logging

3. **Code Standards**:
   - Enforce ESLint rules
   - Implement pre-commit hooks
   - Add automated code reviews
    `.trim();
  }
}

// Usage example
export async function runComprehensiveCodeReview() {
  const analyzer = new ProfessionalCodeAnalyzer();
  const reports = await analyzer.analyzeCodebase('./src');
  
  console.log('\n' + analyzer.generateSummaryReport());
  
  return {
    reports,
    summary: analyzer.generateSummaryReport()
  };
}

// Export for CLI usage
if (require.main === module) {
  runComprehensiveCodeReview().catch(console.error);
}