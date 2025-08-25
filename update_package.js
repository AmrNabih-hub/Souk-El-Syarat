const fs = require('fs');

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Add engines
    packageJson.engines = {
        "node": ">=20.19.0",
        "npm": ">=10.0.0"
    };

    // Update/add scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["lint:ci"] = "eslint . --ext ts,tsx --max-warnings 200 --quiet";
    packageJson.scripts["build:emergency"] = "NODE_ENV=production vite build --mode production --logLevel warn";
    packageJson.scripts["test:emergency"] = "vitest run --reporter=basic --coverage=false --run --silent";
    packageJson.scripts["lint:emergency"] = "eslint . --ext ts,tsx --config .eslintrc.emergency.js --max-warnings 300 --quiet";

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('SUCCESS');
} catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
}
