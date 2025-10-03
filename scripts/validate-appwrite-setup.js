#!/usr/bin/env node

// 🚀 Appwrite Deployment Readiness Validator
// Comprehensive validation script to ensure 100% deployment readiness

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

console.log('🔍 APPWRITE DEPLOYMENT READINESS VALIDATION')
console.log('==========================================\n')

let totalChecks = 0
let passedChecks = 0
const errors = []
const warnings = []

function check(name, condition, errorMessage = null, warningMessage = null) {
  totalChecks++
  console.log(`Checking: ${name}...`)
  
  if (condition) {
    console.log(`✅ ${name}`)
    passedChecks++
  } else {
    console.log(`❌ ${name}`)
    if (errorMessage) {
      errors.push(`${name}: ${errorMessage}`)
    }
    if (warningMessage) {
      warnings.push(`${name}: ${warningMessage}`)
    }
  }
}

function fileExists(filepath) {
  return fs.existsSync(path.join(projectRoot, filepath))
}

function readJson(filepath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(projectRoot, filepath), 'utf8'))
  } catch {
    return null
  }
}

function readFile(filepath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filepath), 'utf8')
  } catch {
    return null
  }
}

// 1. Package.json validation
console.log('📦 PACKAGE VALIDATION')
console.log('--------------------')
const packageJson = readJson('package.json')
check(
  'package.json exists',
  packageJson !== null,
  'package.json not found'
)

check(
  'Appwrite dependency',
  packageJson?.dependencies?.appwrite !== undefined,
  'Appwrite SDK not found in dependencies'
)

check(
  'React dependency',
  packageJson?.dependencies?.react !== undefined,
  'React not found in dependencies'
)

check(
  'Build script exists',
  packageJson?.scripts?.build !== undefined,
  'Build script not found in package.json'
)

console.log('')

// 2. Appwrite configuration validation
console.log('⚙️  APPWRITE CONFIGURATION')
console.log('-------------------------')
check(
  'Appwrite config file',
  fileExists('src/config/appwrite.config.ts'),
  'Appwrite configuration file missing'
)

const appwriteConfig = readFile('src/config/appwrite.config.ts')
check(
  'Appwrite endpoint configured',
  appwriteConfig?.includes('VITE_APPWRITE_ENDPOINT'),
  'Appwrite endpoint not configured'
)

check(
  'Appwrite project ID configured',
  appwriteConfig?.includes('VITE_APPWRITE_PROJECT_ID'),
  'Appwrite project ID not configured'
)

check(
  'Appwrite database ID configured',
  appwriteConfig?.includes('VITE_APPWRITE_DATABASE_ID'),
  'Appwrite database ID not configured'
)

console.log('')

// 3. Environment configuration
console.log('🌍 ENVIRONMENT CONFIGURATION')
console.log('----------------------------')
check(
  'Production environment file',
  fileExists('.env.production'),
  'Production environment file missing'
)

const prodEnv = readFile('.env.production')
check(
  'Production Appwrite endpoint',
  prodEnv?.includes('VITE_APPWRITE_ENDPOINT'),
  'Production Appwrite endpoint not configured'
)

check(
  'Production Appwrite project ID',
  prodEnv?.includes('VITE_APPWRITE_PROJECT_ID'),
  'Production Appwrite project ID not configured'
)

console.log('')

// 4. Service files validation
console.log('🔧 APPWRITE SERVICES')
console.log('-------------------')
check(
  'Auth service file',
  fileExists('src/services/appwrite-auth.service.ts'),
  'Appwrite auth service missing'
)

check(
  'Database service file',
  fileExists('src/services/appwrite-database.service.ts'),
  'Appwrite database service missing'
)

check(
  'Storage service file',
  fileExists('src/services/appwrite-storage.service.ts'),
  'Appwrite storage service missing'
)

console.log('')

// 5. Build validation
console.log('🏗️  BUILD VALIDATION')
console.log('-------------------')
check(
  'Vite config exists',
  fileExists('vite.config.ts'),
  'Vite configuration missing'
)

check(
  'TypeScript config exists',
  fileExists('tsconfig.json'),
  'TypeScript configuration missing'
)

check(
  'Tailwind config exists',
  fileExists('tailwind.config.js'),
  'Tailwind configuration missing'
)

console.log('')

// 6. AWS/Legacy dependency check
console.log('🧹 LEGACY DEPENDENCY CHECK')
console.log('--------------------------')
const awsDeps = [
  'aws-amplify',
  '@aws-amplify/ui-react',
  'aws-amplify-react',
  '@aws-amplify/core',
  '@aws-amplify/auth',
  '@aws-amplify/storage'
]

awsDeps.forEach(dep => {
  check(
    `No ${dep} dependency`,
    !packageJson?.dependencies?.[dep] && !packageJson?.devDependencies?.[dep],
    null,
    `Found legacy AWS dependency: ${dep}`
  )
})

// Check for AWS imports in code
const srcFiles = []
try {
  function getAllTsFiles(dir) {
    const files = fs.readdirSync(path.join(projectRoot, dir))
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const fullPath = path.join(projectRoot, filePath)
      if (fs.statSync(fullPath).isDirectory()) {
        getAllTsFiles(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        srcFiles.push(filePath)
      }
    })
  }
  getAllTsFiles('src')
} catch (e) {
  // Ignore if src directory doesn't exist
}

let awsImportsFound = false
srcFiles.forEach(file => {
  const content = readFile(file)
  if (content && (content.includes('aws-amplify') || content.includes('@aws-amplify'))) {
    awsImportsFound = true
    warnings.push(`AWS import found in ${file}`)
  }
})

check(
  'No AWS imports in source code',
  !awsImportsFound,
  null,
  'Found AWS imports in source code'
)

console.log('')

// 7. Production build test
console.log('🎯 PRODUCTION BUILD CHECK')
console.log('-------------------------')
check(
  'Distribution folder exists',
  fileExists('dist'),
  'Distribution folder not found - run npm run build first'
)

check(
  'Index.html in dist',
  fileExists('dist/index.html'),
  'Built index.html not found in dist folder'
)

console.log('')

// Summary
console.log('📊 VALIDATION SUMMARY')
console.log('====================')
console.log(`✅ Passed: ${passedChecks}/${totalChecks}`)
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks}`)

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:')
  warnings.forEach(warning => console.log(`   - ${warning}`))
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:')
  errors.forEach(error => console.log(`   - ${error}`))
}

const score = Math.round((passedChecks / totalChecks) * 100)
console.log(`\n📈 READINESS SCORE: ${score}%`)

if (score >= 95) {
  console.log('\n🎉 EXCELLENT! Your app is ready for Appwrite deployment!')
  process.exit(0)
} else if (score >= 80) {
  console.log('\n⚠️  GOOD! Minor issues need attention before deployment.')
  process.exit(1)
} else {
  console.log('\n❌ NEEDS WORK! Critical issues must be resolved before deployment.')
  process.exit(1)
}