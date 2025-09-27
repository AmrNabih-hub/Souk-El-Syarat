# Professional Build Script for Souk El-Sayarat
# Handles dependency resolution and ensures successful AWS Amplify deployment

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Blue = [System.ConsoleColor]::Blue

function Write-ColorOutput {
    param([string]$Message, [System.ConsoleColor]$Color = [System.ConsoleColor]::White)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

try {
    Write-ColorOutput "🚀 Starting Professional Build Process for Souk El-Sayarat" $Blue
    Write-ColorOutput "Environment: $Environment" $Blue
    Write-ColorOutput "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" $Blue
    Write-ColorOutput "=" * 60 $Blue

    # Step 1: Environment Validation
    Write-Step "Validating build environment..."
    
    # Check Node.js version
    $nodeVersion = node --version
    Write-ColorOutput "Node.js version: $nodeVersion" $Green
    
    # Check npm version
    $npmVersion = npm --version
    Write-ColorOutput "npm version: $npmVersion" $Green

    # Step 2: Clean previous builds
    Write-Step "Cleaning previous build artifacts..."
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Success "Removed previous dist directory"
    }
    if (Test-Path "node_modules/.vite") {
        Remove-Item -Recurse -Force "node_modules/.vite"
        Write-Success "Cleared Vite cache"
    }

    # Step 3: Install dependencies with optimizations
    Write-Step "Installing dependencies with professional configuration..."
    npm ci --prefer-offline --no-audit --no-fund --silent
    Write-Success "Dependencies installed successfully"

    # Step 4: Run type checking
    Write-Step "Running TypeScript type checking..."
    npm run type-check:ci
    Write-Success "TypeScript compilation successful"

    # Step 5: Run tests (if not skipped)
    if (-not $SkipTests) {
        Write-Step "Running test suite..."
        npm run test:coverage
        Write-Success "All tests passed"
    } else {
        Write-Warning "Tests skipped as requested"
    }

    # Step 6: Run linting and formatting
    Write-Step "Running code quality checks..."
    npm run format:check
    Write-Success "Code formatting verified"

    # Step 7: Build the application
    Write-Step "Building application for $Environment environment..."
    
    if ($Environment -eq "production") {
        # Use production configuration
        $env:NODE_ENV = "production"
        $env:VITE_BUILD_TARGET = "production"
        npm run build:production
    } else {
        # Use development configuration
        npm run build
    }
    
    Write-Success "Application build completed successfully"

    # Step 8: Verify build artifacts
    Write-Step "Verifying build artifacts..."
    if (Test-Path "dist/index.html") {
        $distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Success "Build artifacts verified. Total size: $([math]::Round($distSize, 2)) MB"
    } else {
        throw "Build artifacts not found!"
    }

    # Step 9: Generate build report
    Write-Step "Generating build report..."
    $buildReport = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Environment = $Environment
        NodeVersion = $nodeVersion
        NpmVersion = $npmVersion
        BuildSize = "$([math]::Round($distSize, 2)) MB"
        Status = "SUCCESS"
    }
    
    $buildReport | ConvertTo-Json | Out-File "build-report.json"
    Write-Success "Build report generated: build-report.json"

    Write-ColorOutput "=" * 60 $Green
    Write-Success "🎉 Professional build completed successfully!"
    Write-ColorOutput "Build artifacts are ready in the 'dist' directory" $Green
    Write-ColorOutput "Total build time: $((Get-Date) - $startTime)" $Green

} catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    
    # Generate error report
    $errorReport = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Environment = $Environment
        Error = $_.Exception.Message
        Status = "FAILED"
    }
    
    $errorReport | ConvertTo-Json | Out-File "build-error.json"
    Write-Error "Error report generated: build-error.json"
    
    exit 1
}