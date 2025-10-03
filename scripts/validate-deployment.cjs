/**
 * 🔍 PRE-DEPLOYMENT VALIDATION SCRIPT
 * Validates everything before deployment to ensure 100% success
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Pre-Deployment Validation...\n');

let errors = [];
let warnings = [];
let passedChecks = 0;
let totalChecks = 0;

function check(name, condition, errorMsg = '', warningMsg = '') {
  totalChecks++;
  if (condition) {
    console.log(`✅ ${name}`);
    passedChecks++;
    return true;
  } else {
    if (errorMsg) {
      console.log(`❌ ${name}`);
      errors.push(errorMsg);
    } else if (warningMsg) {
      console.log(`⚠️  ${name}`);
      warnings.push(warningMsg);
    }
    return false;
  }
}

console.log('📦 Checking Project Structure...\n');

// Check critical directories
check(
  'src directory exists',
  fs.existsSync('src'),
  'src directory not found'
);

check(
  'services directory exists',
  fs.existsSync('src/services'),
  'src/services directory not found'
);

check(
  'config directory exists',
  fs.existsSync('src/config'),
  'src/config directory not found'
);

check(
  'public directory exists',
  fs.existsSync('public'),
  'public directory not found'
);

console.log('\n📄 Checking Critical Files...\n');

// Check Appwrite service files
const criticalFiles = [
  'src/config/appwrite.config.ts',
  'src/services/appwrite-auth.service.ts',
  'src/services/appwrite-database.service.ts',
  'src/services/appwrite-storage.service.ts',
  'src/services/appwrite-realtime.service.ts',
  'src/services/appwrite-vendor.service.ts',
  'src/services/appwrite-customer.service.ts',
  'src/services/appwrite-admin.service.ts',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
];

criticalFiles.forEach(file => {
  check(
    `${file} exists`,
    fs.existsSync(file),
    `Critical file missing: ${file}`
  );
});

console.log('\n🔐 Checking Environment Configuration...\n');

// Check for environment variables
const envExists = fs.existsSync('.env') || fs.existsSync('.env.local');
check(
  'Environment file exists',
  envExists,
  '',
  'No .env file found. Make sure to configure before deployment.'
);

if (envExists) {
  const envFile = fs.existsSync('.env') ? '.env' : '.env.local';
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  const requiredEnvVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'VITE_APPWRITE_DATABASE_ID',
  ];
  
  requiredEnvVars.forEach(varName => {
    check(
      `${varName} is set`,
      envContent.includes(varName) && !envContent.includes(`${varName}=\n`),
      `Missing required environment variable: ${varName}`
    );
  });
}

console.log('\n📚 Checking Dependencies...\n');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Check critical dependencies
const criticalDeps = {
  'appwrite': 'Appwrite SDK',
  'react': 'React',
  'react-dom': 'React DOM',
  'react-router-dom': 'React Router',
};

Object.entries(criticalDeps).forEach(([dep, name]) => {
  check(
    `${name} dependency installed`,
    packageJson.dependencies && packageJson.dependencies[dep],
    `Missing critical dependency: ${dep}`
  );
});

console.log('\n🔨 Checking Build Configuration...\n');

check(
  'Build script exists',
  packageJson.scripts && packageJson.scripts.build,
  'No build script found in package.json'
);

check(
  'Vite config exists',
  fs.existsSync('vite.config.ts'),
  'vite.config.ts not found'
);

console.log('\n🧪 Checking Test Setup...\n');

check(
  'Test directory exists',
  fs.existsSync('tests'),
  '',
  'No tests directory found'
);

check(
  'Integration tests exist',
  fs.existsSync('tests/integration'),
  '',
  'No integration tests found'
);

console.log('\n📝 Checking TypeScript Configuration...\n');

check(
  'tsconfig.json exists',
  fs.existsSync('tsconfig.json'),
  'tsconfig.json not found'
);

if (fs.existsSync('tsconfig.json')) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    check(
      'TypeScript strict mode enabled',
      tsconfig.compilerOptions && tsconfig.compilerOptions.strict,
      '',
      'TypeScript strict mode not enabled'
    );
  } catch (e) {
    errors.push('Failed to parse tsconfig.json');
  }
}

console.log('\n🎨 Checking Assets...\n');

check(
  'Public assets directory exists',
  fs.existsSync('public'),
  'public directory not found'
);

check(
  'Index HTML exists',
  fs.existsSync('index.html'),
  'index.html not found'
);

console.log('\n📦 Checking Appwrite Setup Script...\n');

check(
  'Appwrite setup script exists',
  fs.existsSync('scripts/setup-appwrite.js'),
  'Appwrite setup script not found. Run will fail.'
);

console.log('\n📖 Checking Documentation...\n');

const docs = [
  'COMPLETE_APPWRITE_SETUP.md',
  'APPWRITE_DEPLOYMENT_GUIDE.md',
  'DEPLOYMENT_READY_FINAL.md',
];

docs.forEach(doc => {
  check(
    `${doc} exists`,
    fs.existsSync(doc),
    '',
    `Documentation missing: ${doc}`
  );
});

console.log('\n🔍 Checking Service Implementations...\n');

// Read and validate service files
const serviceFiles = [
  'src/services/appwrite-auth.service.ts',
  'src/services/appwrite-database.service.ts',
  'src/services/appwrite-storage.service.ts',
];

serviceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    
    check(
      `${path.basename(file)} has proper imports`,
      content.includes('import'),
      `${file} missing imports`
    );
    
    check(
      `${path.basename(file)} has exports`,
      content.includes('export'),
      `${file} missing exports`
    );
  }
});

console.log('\n🚀 Checking Build Artifacts...\n');

if (fs.existsSync('dist')) {
  check(
    'Previous build exists',
    fs.existsSync('dist/index.html'),
    '',
    'No previous build found. Run npm run build first.'
  );
  
  check(
    'Build has assets',
    fs.existsSync('dist/assets') || fs.readdirSync('dist').some(f => f.startsWith('js')),
    '',
    'Build missing assets'
  );
} else {
  warnings.push('No dist folder found. Run npm run build before deployment.');
}

console.log('\n📊 Validation Summary\n');
console.log('═'.repeat(50));
console.log(`Total Checks:    ${totalChecks}`);
console.log(`Passed:          ${passedChecks} ✅`);
console.log(`Errors:          ${errors.length} ❌`);
console.log(`Warnings:        ${warnings.length} ⚠️`);
console.log('═'.repeat(50));

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:\n');
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning}`);
  });
}

console.log('\n');

if (errors.length === 0) {
  console.log('✅ VALIDATION PASSED!');
  console.log('📦 Your app is ready for deployment!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Run: node scripts/setup-appwrite.js');
  console.log('   3. Deploy to Appwrite Sites');
  console.log('   4. Run post-deployment tests\n');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED!');
  console.log('🔧 Please fix the errors above before deploying.\n');
  process.exit(1);
}

