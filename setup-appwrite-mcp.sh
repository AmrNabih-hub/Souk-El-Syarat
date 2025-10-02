#!/bin/bash

# Souk El-Sayarat - Appwrite MCP Setup Script
# This script helps configure Appwrite MCP for automated development

echo "🚀 Souk El-Sayarat - Appwrite MCP Setup"
echo "========================================"
echo ""

# Check if uvx is installed
if ! command -v uvx &> /dev/null; then
    echo "📦 Installing uv (Python package manager)..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    fi
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "✅ uv is installed"
echo ""

# Get Appwrite credentials
echo "🔐 Appwrite Configuration"
echo "========================="
echo ""
echo "Please provide your Appwrite credentials:"
echo "(You can get these from https://cloud.appwrite.io)"
echo ""

read -p "Enter your Appwrite Project ID: " PROJECT_ID
read -p "Enter your Appwrite API Key: " API_KEY
read -p "Enter your Appwrite Endpoint [https://cloud.appwrite.io/v1]: " ENDPOINT
ENDPOINT=${ENDPOINT:-https://cloud.appwrite.io/v1}

echo ""
echo "📝 Updating MCP configuration..."

# Update MCP configuration
MCP_CONFIG="$HOME/.cursor/mcp.json"
mkdir -p "$HOME/.cursor"

cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "appwrite": {
      "command": "uvx",
      "args": [
        "mcp-server-appwrite",
        "--all"
      ],
      "env": {
        "APPWRITE_API_KEY": "$API_KEY",
        "APPWRITE_PROJECT_ID": "$PROJECT_ID",
        "APPWRITE_ENDPOINT": "$ENDPOINT"
      }
    }
  }
}
EOF

echo "✅ MCP configuration updated at $MCP_CONFIG"
echo ""

# Create .env file for the project
echo "📝 Creating project .env file..."
cat > .env << EOF
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=$ENDPOINT
VITE_APPWRITE_PROJECT_ID=$PROJECT_ID

# App Configuration
VITE_APP_NAME=Souk El-Sayarat
VITE_CURRENCY=EGP
VITE_DEFAULT_LANGUAGE=ar
VITE_ENVIRONMENT=development
EOF

echo "✅ Environment file created"
echo ""

# Test MCP connection
echo "🧪 Testing MCP connection..."
uvx mcp-server-appwrite --help > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Appwrite MCP is ready!"
else
    echo "⚠️  MCP server needs to be installed. Installing now..."
    pip install mcp-server-appwrite
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Cursor/VSCode for MCP changes to take effect"
echo "2. Run the automated Appwrite setup: bash setup-appwrite-infrastructure.sh"
echo ""

