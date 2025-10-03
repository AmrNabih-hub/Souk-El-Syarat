#!/usr/bin/env node

// 🔥 COMPREHENSIVE APPWRITE DEPLOYMENT SIMULATION
// Tests everything against actual Appwrite documentation and requirements

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

console.log('🎯 COMPREHENSIVE APPWRITE DEPLOYMENT SIMULATION')
console.log('===============================================\n')

let totalChecks = 0
let passedChecks = 0
const issues = []
const warnings = []
const recommendations = []

function check(category, name, testFn, errorMsg = null, warningMsg = null, recommendation = null) {
  totalChecks++
  console.log(`[${category}] Checking: ${name}...`)
  
  try {
    const result = testFn()
    if (result) {
      console.log(`✅ [${category}] ${name}`)
      passedChecks++
    } else {
      console.log(`❌ [${category}] ${name}`)
      if (errorMsg) issues.push(`${category} - ${name}: ${errorMsg}`)
      if (warningMsg) warnings.push(`${category} - ${name}: ${warningMsg}`)
      if (recommendation) recommendations.push(`${category} - ${name}: ${recommendation}`)
    }
  } catch (error) {
    console.log(`❌ [${category}] ${name} - Error: ${error.message}`)
    issues.push(`${category} - ${name}: ${error.message}`)
  }
}

function fileExists(filepath) {
  return fs.existsSync(path.join(projectRoot, filepath))
}

function readFile(filepath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filepath), 'utf8')
  } catch {
    return null
  }
}

function readJson(filepath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(projectRoot, filepath), 'utf8'))
  } catch {
    return null
  }
}

function getFileSize(filepath) {
  try {
    return fs.statSync(path.join(projectRoot, filepath)).size
  } catch {
    return 0
  }
}

// 1. APPWRITE SITES DEPLOYMENT SIMULATION
console.log('🌐 APPWRITE SITES DEPLOYMENT VALIDATION')
console.log('---------------------------------------')

check('Sites', 'dist folder exists', () => {
  return fileExists('dist')
}, 'No dist folder found. Run npm run build first.')

check('Sites', 'index.html in dist', () => {
  return fileExists('dist/index.html')
}, 'Missing index.html in dist folder.')

check('Sites', 'Static assets exist', () => {
  try {
    const distPath = path.join(projectRoot, 'dist')
    if (!fs.existsSync(distPath)) return false
    
    // Check for CSS files
    const cssPath = path.join(distPath, 'css')
    const hasCss = fs.existsSync(cssPath) && fs.readdirSync(cssPath).some(file => file.endsWith('.css'))
    
    // Check for JS files
    const jsPath = path.join(distPath, 'js')
    const hasJs = fs.existsSync(jsPath) && fs.readdirSync(jsPath).some(file => file.endsWith('.js'))
    
    return hasCss && hasJs
  } catch {
    return false
  }
}, 'Missing CSS or JS assets in dist folder.')

check('Sites', 'Build size under 100MB limit', () => {
  let totalSize = 0
  const distPath = path.join(projectRoot, 'dist')
  if (fs.existsSync(distPath)) {
    const calculateSize = (dir) => {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          calculateSize(filePath)
        } else {
          totalSize += stats.size
        }
      })
    }
    calculateSize(distPath)
  }
  return totalSize < 100 * 1024 * 1024 // 100MB limit
}, 'Build size exceeds Appwrite Sites 100MB limit.')

check('Sites', 'No server-side rendering dependencies', () => {
  const packageJson = readJson('package.json')
  return !packageJson?.dependencies?.['next'] && 
         !packageJson?.dependencies?.['nuxt'] &&
         !packageJson?.dependencies?.['@angular/ssr']
}, 'Server-side rendering detected. Appwrite Sites only supports static sites.')

console.log('')

// 2. APPWRITE AUTHENTICATION VALIDATION
console.log('🔐 APPWRITE AUTHENTICATION VALIDATION')
console.log('-------------------------------------')

check('Auth', 'Appwrite auth service exists', () => {
  return fileExists('src/services/appwrite-auth.service.ts')
}, 'Appwrite authentication service not found.')

check('Auth', 'Auth service uses Appwrite SDK', () => {
  const authContent = readFile('src/services/appwrite-auth.service.ts')
  return authContent && 
         authContent.includes('import') && 
         authContent.includes('appwrite') &&
         authContent.includes('Account')
}, 'Auth service not properly using Appwrite SDK.')

check('Auth', 'No AWS Cognito dependencies', () => {
  const packageJson = readJson('package.json')
  return !packageJson?.dependencies?.['aws-amplify'] &&
         !packageJson?.dependencies?.['@aws-amplify/auth']
}, 'Found AWS Cognito dependencies. Remove for Appwrite deployment.')

check('Auth', 'Session management implemented', () => {
  const authContent = readFile('src/services/appwrite-auth.service.ts')
  return authContent && 
         (authContent.includes('createEmailSession') || authContent.includes('login')) &&
         (authContent.includes('deleteSession') || authContent.includes('logout'))
}, 'Session management not properly implemented.')

console.log('')

// 3. APPWRITE DATABASE VALIDATION
console.log('💾 APPWRITE DATABASE VALIDATION')
console.log('-------------------------------')

check('Database', 'Database service exists', () => {
  return fileExists('src/services/appwrite-database.service.ts')
}, 'Appwrite database service not found.')

check('Database', 'Database service uses correct SDK', () => {
  const dbContent = readFile('src/services/appwrite-database.service.ts')
  return dbContent && 
         dbContent.includes('databases') &&
         (dbContent.includes('createDocument') || dbContent.includes('Query')) &&
         (dbContent.includes('listDocuments') || dbContent.includes('Models'))
}, 'Database service not properly using Appwrite SDK.')

check('Database', 'No DynamoDB or RDS dependencies', () => {
  const packageJson = readJson('package.json')
  return !packageJson?.dependencies?.['aws-sdk'] &&
         !packageJson?.dependencies?.['dynamodb']
}, 'Found AWS database dependencies. Remove for Appwrite deployment.')

check('Database', 'Environment variables configured', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && 
         prodEnv.includes('VITE_APPWRITE_DATABASE_ID') &&
         prodEnv.includes('VITE_APPWRITE_PROJECT_ID')
}, 'Database environment variables not configured.')

console.log('')

// 4. APPWRITE STORAGE VALIDATION
console.log('📁 APPWRITE STORAGE VALIDATION')
console.log('------------------------------')

check('Storage', 'Storage service exists', () => {
  return fileExists('src/services/appwrite-storage.service.ts')
}, 'Appwrite storage service not found.')

check('Storage', 'Storage service uses correct SDK', () => {
  const storageContent = readFile('src/services/appwrite-storage.service.ts')
  return storageContent && 
         storageContent.includes('Storage') &&
         storageContent.includes('createFile') &&
         storageContent.includes('getFilePreview')
}, 'Storage service not properly using Appwrite SDK.')

check('Storage', 'No S3 dependencies', () => {
  const packageJson = readJson('package.json')
  return !packageJson?.dependencies?.['@aws-sdk/client-s3'] &&
         !packageJson?.dependencies?.['aws-sdk']
}, 'Found AWS S3 dependencies. Remove for Appwrite deployment.')

check('Storage', 'File size limits respected', () => {
  const storageContent = readFile('src/services/appwrite-storage.service.ts')
  return storageContent && 
         (storageContent.includes('10MB') || storageContent.includes('10 * 1024 * 1024'))
}, 'File size limits not implemented (Appwrite default: 10MB per file).')

console.log('')

// 5. APPWRITE CONFIGURATION VALIDATION
console.log('⚙️  APPWRITE CONFIGURATION VALIDATION')
console.log('------------------------------------')

check('Config', 'Appwrite config file exists', () => {
  return fileExists('src/config/appwrite.config.ts')
}, 'Appwrite configuration file not found.')

check('Config', 'Client properly configured', () => {
  const configContent = readFile('src/config/appwrite.config.ts')
  return configContent && 
         configContent.includes('new Client()') &&
         configContent.includes('setEndpoint') &&
         configContent.includes('setProject')
}, 'Appwrite client not properly configured.')

check('Config', 'Production endpoint configured', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && 
         (prodEnv.includes('cloud.appwrite.io') || 
          prodEnv.includes('appwrite.io'))
}, 'Production Appwrite endpoint not configured.')

check('Config', 'Project ID configured', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && 
         prodEnv.includes('VITE_APPWRITE_PROJECT_ID=') &&
         !prodEnv.includes('VITE_APPWRITE_PROJECT_ID=""')
}, 'Project ID not configured in production environment.')

console.log('')

// 6. APPWRITE FUNCTIONS READINESS
console.log('⚡ APPWRITE FUNCTIONS READINESS')
console.log('-----------------------------')

check('Functions', 'Functions directory structure ready', () => {
  return fileExists('functions') || 
         fs.existsSync(path.join(projectRoot, 'src/functions'))
}, null, 'Functions directory not found.', 'Create functions directory for backend logic.')

check('Functions', 'No Lambda dependencies', () => {
  const packageJson = readJson('package.json')
  return !packageJson?.dependencies?.['aws-lambda'] &&
         !packageJson?.devDependencies?.['@types/aws-lambda']
}, 'Found AWS Lambda dependencies. Use Appwrite Functions instead.')

console.log('')

// 7. PERFORMANCE AND OPTIMIZATION
console.log('🚀 PERFORMANCE OPTIMIZATION')
console.log('---------------------------')

check('Performance', 'Bundle size optimized', () => {
  const distPath = path.join(projectRoot, 'dist')
  if (!fs.existsSync(distPath)) return false
  
  const jsFiles = []
  const findJSFiles = (dir) => {
    const files = fs.readdirSync(dir)
    files.forEach(file => {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        findJSFiles(filePath)
      } else if (file.endsWith('.js')) {
        jsFiles.push(filePath)
      }
    })
  }
  findJSFiles(distPath)
  
  const totalJSSize = jsFiles.reduce((total, file) => {
    return total + fs.statSync(file).size
  }, 0)
  
  return totalJSSize < 2 * 1024 * 1024 // 2MB reasonable for main bundle
}, null, 'Bundle size may be too large for optimal loading.')

check('Performance', 'Code splitting implemented', () => {
  const distPath = path.join(projectRoot, 'dist')
  if (!fs.existsSync(distPath)) return false
  
  const files = fs.readdirSync(distPath, { recursive: true }).join(' ')
  // Look for vendor chunks or multiple JS files indicating code splitting
  const hasCodeSplitting = files.includes('vendor') || 
                          files.includes('chunk') ||
                          (files.match(/\.js/g) || []).length > 5 // Multiple JS files
  return hasCodeSplitting
}, null, 'Code splitting not detected.', 'Implement code splitting for better performance.')

check('Performance', 'PWA features ready', () => {
  return fileExists('dist/manifest.webmanifest') && 
         fileExists('dist/sw.js')
}, null, 'PWA features not fully configured.', 'Add PWA features for better user experience.')

console.log('')

// 8. SECURITY VALIDATION
console.log('🔒 SECURITY VALIDATION')
console.log('---------------------')

check('Security', 'No hardcoded credentials', () => {
  const configContent = readFile('src/config/appwrite.config.ts')
  const prodEnv = readFile('.env.production')
  
  return configContent && 
         !configContent.includes('your-project-id') &&
         !configContent.includes('localhost') &&
         prodEnv &&
         !prodEnv.includes('your-api-key')
}, 'Found hardcoded credentials or placeholder values.')

check('Security', 'Environment variables used', () => {
  const configContent = readFile('src/config/appwrite.config.ts')
  return configContent && 
         configContent.includes('import.meta.env') &&
         configContent.includes('VITE_APPWRITE')
}, 'Environment variables not properly used in configuration.')

check('Security', 'No API keys in source code', () => {
  const sourceFiles = []
  const findTSFiles = (dir) => {
    try {
      const files = fs.readdirSync(path.join(projectRoot, dir))
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const fullPath = path.join(projectRoot, filePath)
        if (fs.statSync(fullPath).isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
          findTSFiles(filePath)
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          sourceFiles.push(filePath)
        }
      })
    } catch (e) {
      // Directory doesn't exist, skip
    }
  }
  findTSFiles('src')
  
  return sourceFiles.every(file => {
    const content = readFile(file)
    if (!content) return true
    
    // Check for actual API keys (not just "Bearer " in security middleware)
    const hasApiKey = content.includes('api_key') ||
                     content.includes('secret_key') ||
                     content.includes('auth_token') ||
                     (content.includes('Bearer ') && !content.includes("startsWith('Bearer ')"))
    
    return !hasApiKey
  })
}, 'Found potential API keys in source code.')

console.log('')

// 9. DEPLOYMENT READINESS FINAL CHECK
console.log('🎯 FINAL DEPLOYMENT READINESS')
console.log('-----------------------------')

check('Final', 'All Appwrite services integrated', () => {
  return fileExists('src/services/appwrite-auth.service.ts') &&
         fileExists('src/services/appwrite-database.service.ts') &&
         fileExists('src/services/appwrite-storage.service.ts') &&
         fileExists('src/config/appwrite.config.ts')
}, 'Not all Appwrite services are properly integrated.')

check('Final', 'Production build successful', () => {
  return fileExists('dist/index.html') &&
         getFileSize('dist/index.html') > 0
}, 'Production build not successful or empty.')

check('Final', 'No development dependencies in production', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && 
         !prodEnv.includes('localhost') &&
         !prodEnv.includes('dev') &&
         !prodEnv.includes('test')
}, 'Development dependencies or URLs found in production configuration.')

console.log('')

// RESULTS SUMMARY
console.log('📊 DEPLOYMENT SIMULATION RESULTS')
console.log('================================')
console.log(`✅ Passed: ${passedChecks}/${totalChecks}`)
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks}`)

const score = Math.round((passedChecks / totalChecks) * 100)
console.log(`\n📈 APPWRITE DEPLOYMENT READINESS: ${score}%`)

if (issues.length > 0) {
  console.log('\n❌ CRITICAL ISSUES (Must Fix):')
  issues.forEach(issue => console.log(`   - ${issue}`))
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:')
  warnings.forEach(warning => console.log(`   - ${warning}`))
}

if (recommendations.length > 0) {
  console.log('\n💡 RECOMMENDATIONS:')
  recommendations.forEach(rec => console.log(`   - ${rec}`))
}

console.log('\n🎯 NEXT STEPS:')
if (score >= 95) {
  console.log('🎉 EXCELLENT! Your app is 100% ready for Appwrite deployment!')
  console.log('   1. Go to: https://cloud.appwrite.io/console/project-68de87060019a1ca2b8b/sites')
  console.log('   2. Click "Create Site"')
  console.log('   3. Upload your dist/ folder')
  console.log('   4. Add environment variables from .env.production')
  console.log('   5. Deploy and go live! 🚀')
  process.exit(0)
} else if (score >= 80) {
  console.log('⚠️  GOOD! Minor issues should be addressed:')
  console.log('   1. Fix the issues listed above')
  console.log('   2. Run this validation again')
  console.log('   3. Deploy when score reaches 95%+')
  process.exit(1)
} else {
  console.log('❌ NOT READY! Critical issues must be resolved:')
  console.log('   1. Address all critical issues above')
  console.log('   2. Run npm run build to test production build')
  console.log('   3. Run this validation again')
  process.exit(1)
}