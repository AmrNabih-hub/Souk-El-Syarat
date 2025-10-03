#!/usr/bin/env node

// 🚀 Deployment Readiness Test Suite
// Tests all critical deployment scenarios

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

console.log('🧪 DEPLOYMENT READINESS TEST SUITE')
console.log('==================================\n')

let totalTests = 0
let passedTests = 0
const failures = []

function test(name, testFn) {
  totalTests++
  console.log(`Testing: ${name}...`)
  
  try {
    const result = testFn()
    if (result === true || result === undefined) {
      console.log(`✅ ${name}`)
      passedTests++
    } else {
      console.log(`❌ ${name}`)
      failures.push(`${name}: Test returned false`)
    }
  } catch (error) {
    console.log(`❌ ${name}`)
    failures.push(`${name}: ${error.message}`)
  }
}

// Helper functions
function fileExists(filepath) {
  return fs.existsSync(path.join(projectRoot, filepath))
}

function fileSize(filepath) {
  try {
    return fs.statSync(path.join(projectRoot, filepath)).size
  } catch {
    return 0
  }
}

function readFile(filepath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filepath), 'utf8')
  } catch {
    return null
  }
}

// Test Suite
console.log('📁 FILE STRUCTURE TESTS')
console.log('-----------------------')

test('Project has package.json', () => {
  return fileExists('package.json')
})

test('Project has source directory', () => {
  return fileExists('src')
})

test('Project has dist directory (build output)', () => {
  return fileExists('dist')
})

test('Dist has index.html', () => {
  return fileExists('dist/index.html')
})

test('Dist has CSS files', () => {
  const distFiles = fs.readdirSync(path.join(projectRoot, 'dist')).join(' ')
  return distFiles.includes('.css')
})

test('Dist has JS files', () => {
  const distFiles = fs.readdirSync(path.join(projectRoot, 'dist')).join(' ')
  return distFiles.includes('.js')
})

console.log('')

console.log('📦 DEPENDENCY TESTS')
console.log('------------------')

test('Appwrite SDK is installed', () => {
  return fileExists('node_modules/appwrite')
})

test('React is installed', () => {
  return fileExists('node_modules/react')
})

test('Vite is installed', () => {
  return fileExists('node_modules/vite')
})

test('No AWS Amplify dependencies', () => {
  return !fileExists('node_modules/aws-amplify')
})

console.log('')

console.log('⚙️  CONFIGURATION TESTS')
console.log('----------------------')

test('Appwrite config file exists', () => {
  return fileExists('src/config/appwrite.config.ts')
})

test('Environment production file exists', () => {
  return fileExists('.env.production')
})

test('Appwrite services exist', () => {
  return fileExists('src/services/appwrite-auth.service.ts') &&
         fileExists('src/services/appwrite-database.service.ts') &&
         fileExists('src/services/appwrite-storage.service.ts')
})

console.log('')

console.log('🏗️  BUILD QUALITY TESTS')
console.log('----------------------')

test('Built index.html has proper structure', () => {
  const indexContent = readFile('dist/index.html')
  return indexContent && 
         indexContent.includes('<!doctype html>') &&
         indexContent.includes('<div id="root">') &&
         indexContent.includes('script')
})

test('Build size is reasonable (< 5MB)', () => {
  const distSize = getDirSize(path.join(projectRoot, 'dist'))
  return distSize < 5 * 1024 * 1024 // 5MB
})

test('No source maps in production build', () => {
  const distFiles = fs.readdirSync(path.join(projectRoot, 'dist')).join(' ')
  return !distFiles.includes('.map')
})

console.log('')

console.log('🔧 FUNCTIONALITY TESTS')
console.log('---------------------')

test('Main app component imports correctly', () => {
  const appContent = readFile('src/App.tsx')
  return appContent && !appContent.includes('aws-amplify')
})

test('Routing is configured', () => {
  const appContent = readFile('src/App.tsx')
  return appContent && (appContent.includes('Router') || appContent.includes('BrowserRouter'))
})

test('Appwrite client is initialized', () => {
  const configContent = readFile('src/config/appwrite.config.ts')
  return configContent && 
         configContent.includes('new Client()') &&
         configContent.includes('setEndpoint') &&
         configContent.includes('setProject')
})

console.log('')

console.log('🌍 ENVIRONMENT TESTS')
console.log('-------------------')

test('Production environment has Appwrite endpoint', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && prodEnv.includes('VITE_APPWRITE_ENDPOINT=')
})

test('Production environment has project ID', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && prodEnv.includes('VITE_APPWRITE_PROJECT_ID=')
})

test('No AWS credentials in environment', () => {
  const prodEnv = readFile('.env.production')
  return prodEnv && 
         !prodEnv.includes('AWS_') &&
         !prodEnv.includes('AMPLIFY_')
})

console.log('')

console.log('🚀 DEPLOYMENT READINESS')
console.log('----------------------')

test('PWA manifest exists', () => {
  return fileExists('dist/manifest.webmanifest') || 
         fileExists('dist/manifest.json') ||
         fileExists('public/manifest.json')
})

test('Service worker ready', () => {
  return fileExists('dist/sw.js') || 
         fileExists('public/sw.js')
})

test('Favicon exists', () => {
  return fileExists('dist/favicon.ico') || 
         fileExists('public/favicon.ico')
})

console.log('')

// Helper function to get directory size
function getDirSize(dirPath) {
  let totalSize = 0
  try {
    const files = fs.readdirSync(dirPath)
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        totalSize += getDirSize(filePath)
      } else {
        totalSize += stats.size
      }
    })
  } catch (e) {
    // Directory doesn't exist or can't be read
  }
  return totalSize
}

// Final Results
console.log('📊 TEST RESULTS')
console.log('==============')
console.log(`✅ Passed: ${passedTests}/${totalTests}`)
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`)

if (failures.length > 0) {
  console.log('\n❌ FAILURES:')
  failures.forEach(failure => console.log(`   - ${failure}`))
}

const score = Math.round((passedTests / totalTests) * 100)
console.log(`\n📈 DEPLOYMENT READINESS: ${score}%`)

if (score >= 90) {
  console.log('\n🎉 EXCELLENT! Ready for deployment!')
  process.exit(0)
} else if (score >= 75) {
  console.log('\n⚠️  GOOD! Minor issues should be fixed.')
  process.exit(1)
} else {
  console.log('\n❌ NOT READY! Critical issues must be resolved.')
  process.exit(1)
}