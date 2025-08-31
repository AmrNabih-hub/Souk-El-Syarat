const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/services/push-notification.service.ts', 'utf8');

// Fix all malformed if statements and try-catch blocks
// Remove duplicate if statements
content = content.replace(/if \(process\.env\.NODE_ENV === ["']development["']\) \{\s*\}\s*if \(process\.env\.NODE_ENV === ["']development["']\)/g, 
  'if (process.env.NODE_ENV === \'development\')');

// Fix orphaned closing braces
content = content.replace(/\}\s*\/\/ console\.(log|error|warn)/g, '  // console.$1');

// Fix try-catch blocks with extra braces
content = content.replace(/} catch \(error\) \{\s*\}\s*\/\//g, '} catch (error) {\n      //');

// Fix any remaining double closing braces
content = content.replace(/\}\s*\}\s*\/\/ console/g, '    // console');

// Write the fixed content back
fs.writeFileSync('src/services/push-notification.service.ts', content);

console.log('✅ Fixed push-notification.service.ts');
