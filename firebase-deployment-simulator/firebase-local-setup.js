/**
 * Firebase Local Environment Setup - Complete Hosting Simulation
 * Mirrors Firebase hosting environment with full build processes and logs
 * Based on Firebase CLI 2025 documentation
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class FirebaseLocalEnvironment {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.firebaseConfig = null;
    this.buildLogs = [];
    this.containerLogs = [];
    this.portMappings = {};
    this.simulationState = {
      initialized: false,
      built: false,
      deployed: false,
      tested: false
    };
  }

  async initializeEnvironment() {
    console.log('🔧 Initializing Firebase Local Environment...');
    
    try {
      // Install Firebase CLI if not present
      await this.installFirebaseCLI();
      
      // Initialize Firebase project
      await this.initializeFirebaseProject();
      
      // Setup hosting configuration
      await this.setupHostingConfig();
      
      // Configure local development server
      await this.setupLocalDevServer();
      
      // Setup container management
      await this.setupContainerManagement();
      
      this.simulationState.initialized = true;
      console.log('✅ Firebase Local Environment initialized successfully');
      
      return {
        success: true,
        state: this.simulationState,
        logs: this.buildLogs
      };
    } catch (error) {
      console.error('❌ Environment initialization failed:', error.message);
      return {
        success: false,
        error: error.message,
        logs: this.buildLogs
      };
    }
  }

  async installFirebaseCLI() {
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      this.buildLogs.push('Firebase CLI already installed');
    } catch {
      console.log('📦 Installing Firebase CLI...');
      execSync('npm install -g firebase-tools@latest', { stdio: 'inherit' });
      this.buildLogs.push('Firebase CLI installed successfully');
    }
  }

  async initializeFirebaseProject() {
    const firebaseJson = {
      hosting: {
        public: "dist",
        ignore: [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ],
        rewrites: [
          {
            source: "**",
            destination: "/index.html"
          }
        ],
        headers: [
          {
            source: "**/*.@(js|css)",
            headers: [
              {
                key: "Cache-Control",
                value: "max-age=31536000"
              }
            ]
          }
        ]
      },
      emulators: {
        hosting: {
          port: 5000
        },
        ui: {
          enabled: true,
          port: 4000
        }
      }
    };

    await fs.writeFile(
      path.join(this.projectPath, 'firebase.json'),
      JSON.stringify(firebaseJson, null, 2)
    );
    
    this.buildLogs.push('Firebase configuration created');
  }

  async setupHostingConfig() {
    const hostingConfig = {
      version: 2,
      builds: [
        {
          src: "package.json",
          use: "@vercel/static-build",
          config: {
            distDir: "dist"
          }
        }
      ],
      routes: [
        {
          src: "/(.*)",
          dest: "/$1"
        }
      ],
      headers: [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff"
            },
            {
              key: "X-Frame-Options",
              value: "DENY"
            },
            {
              key: "X-XSS-Protection",
              value: "1; mode=block"
            }
          ]
        }
      ]
    };

    await fs.writeFile(
      path.join(this.projectPath, 'vercel.json'),
      JSON.stringify(hostingConfig, null, 2)
    );
    
    this.buildLogs.push('Hosting configuration completed');
  }

  async setupLocalDevServer() {
    const devServerConfig = {
      port: 5000,
      host: 'localhost',
      open: true,
      historyApiFallback: true,
      hot: true,
      compress: true,
      static: {
        directory: path.join(this.projectPath, 'dist')
      },
      watchFiles: ['src/**/*'],
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    };

    await fs.writeFile(
      path.join(this.projectPath, 'webpack.dev.js'),
      `const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devServer: ${JSON.stringify(devServerConfig, null, 2)}
});`
    );
    
    this.portMappings = {
      development: 5000,
      staging: 5001,
      production: 5002
    };
    
    this.buildLogs.push('Local development server configured');
  }

  async setupContainerManagement() {
    const dockerfile = `# Multi-stage build for Firebase hosting simulation
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

    const nginxConfig = `events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}`;

    await fs.writeFile(path.join(this.projectPath, 'Dockerfile'), dockerfile);
    await fs.writeFile(path.join(this.projectPath, 'nginx.conf'), nginxConfig);
    
    this.containerLogs.push('Container management setup completed');
  }

  async buildProject() {
    console.log('🏗️  Building project for Firebase hosting...');
    
    try {
      const buildOutput = execSync('npm run build', { 
        cwd: this.projectPath,
        encoding: 'utf8'
      });
      
      this.buildLogs.push('Build completed successfully');
      this.buildLogs.push(buildOutput);
      
      this.simulationState.built = true;
      
      return {
        success: true,
        buildSize: await this.calculateBuildSize(),
        logs: this.buildLogs
      };
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      return {
        success: false,
        error: error.message,
        logs: this.buildLogs
      };
    }
  }

  async calculateBuildSize() {
    const distPath = path.join(this.projectPath, 'dist');
    try {
      const files = await this.getAllFiles(distPath);
      let totalSize = 0;
      
      for (const file of files) {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      }
      
      return {
        totalSize: totalSize,
        fileCount: files.length,
        humanReadable: this.formatBytes(totalSize)
      };
    } catch {
      return { totalSize: 0, fileCount: 0, humanReadable: '0 B' };
    }
  }

  async getAllFiles(dirPath, files = []) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async startLocalEmulator() {
    console.log('🚀 Starting Firebase Local Emulator...');
    
    try {
      const emulatorProcess = execSync('firebase emulators:start --only hosting', {
        cwd: this.projectPath,
        stdio: 'pipe'
      });
      
      this.containerLogs.push('Firebase emulator started successfully');
      this.simulationState.deployed = true;
      
      return {
        success: true,
        url: 'http://localhost:5000',
        uiUrl: 'http://localhost:4000',
        logs: this.containerLogs
      };
    } catch (error) {
      console.error('❌ Emulator startup failed:', error.message);
      return {
        success: false,
        error: error.message,
        logs: this.containerLogs
      };
    }
  }

  async runHealthChecks() {
    console.log('🏥 Running health checks...');
    
    const checks = [
      this.checkPortAvailability(5000),
      this.checkFirebaseConfig(),
      this.checkBuildIntegrity(),
      this.checkDependencies()
    ];
    
    const results = await Promise.all(checks);
    
    return {
      allPassed: results.every(r => r.passed),
      results: results,
      summary: results.reduce((acc, check) => {
        acc[check.name] = check;
        return acc;
      }, {})
    };
  }

  async checkPortAvailability(port) {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close();
        resolve({ name: 'Port Check', passed: true, port });
      });
      server.on('error', () => {
        resolve({ name: 'Port Check', passed: false, port, error: 'Port in use' });
      });
    });
  }

  async checkFirebaseConfig() {
    try {
      const firebaseJson = await fs.readFile(path.join(this.projectPath, 'firebase.json'));
      JSON.parse(firebaseJson);
      return { name: 'Firebase Config', passed: true };
    } catch {
      return { name: 'Firebase Config', passed: false, error: 'Invalid configuration' };
    }
  }

  async checkBuildIntegrity() {
    try {
      const distPath = path.join(this.projectPath, 'dist');
      await fs.access(distPath);
      return { name: 'Build Integrity', passed: true };
    } catch {
      return { name: 'Build Integrity', passed: false, error: 'Build directory missing' };
    }
  }

  async checkDependencies() {
    try {
      const packageJson = await fs.readFile(path.join(this.projectPath, 'package.json'));
      const pkg = JSON.parse(packageJson);
      return { 
        name: 'Dependencies', 
        passed: true, 
        dependencies: Object.keys(pkg.dependencies || {}).length 
      };
    } catch {
      return { name: 'Dependencies', passed: false, error: 'Package.json missing' };
    }
  }

  async generateDeploymentReport() {
    const report = {
      timestamp: new Date().toISOString(),
      simulationState: this.simulationState,
      buildMetrics: await this.calculateBuildSize(),
      portMappings: this.portMappings,
      healthChecks: await this.runHealthChecks(),
      logs: {
        build: this.buildLogs,
        container: this.containerLogs
      }
    };

    await fs.writeFile(
      path.join(this.projectPath, 'deployment-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }
}

module.exports = FirebaseLocalEnvironment;