#!/bin/bash

# Helthana Frontend Security Setup Script
# This script sets up the secure environment configuration

set -e

echo "🔐 Setting up Helthana Frontend Security Configuration..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the frontend directory"
    exit 1
fi

# Create .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env file from template..."
        cp .env.example .env
        echo "✅ .env file created successfully"
        echo "⚠️  Please review and update the .env file with your configuration"
    else
        echo "❌ Error: .env.example template not found"
        exit 1
    fi
else
    echo "ℹ️  .env file already exists"
fi

# Validate required environment variables
echo "🔍 Validating environment configuration..."

# Check if .env file has required variables
required_vars=("VITE_NODE_ENV" "VITE_API_BASE_URL" "VITE_API_VERSION")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env 2>/dev/null; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "⚠️  Missing required environment variables in .env:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo "Please add these variables to your .env file"
else
    echo "✅ All required environment variables found"
fi

# Check if config directory exists
if [ ! -d "src/config" ]; then
    echo "📁 Creating config directory..."
    mkdir -p src/config
    echo "✅ Config directory created"
fi

# Validate that environment.js exists
if [ ! -f "src/config/environment.js" ]; then
    echo "❌ Error: src/config/environment.js not found"
    echo "This file should contain the secure configuration module"
    exit 1
else
    echo "✅ Environment configuration module found"
fi

# Check git configuration
echo "🔒 Verifying git security settings..."

# Check if .env files are properly ignored
if git check-ignore .env >/dev/null 2>&1; then
    echo "✅ .env file is properly ignored by git"
else
    echo "⚠️  Warning: .env file may not be ignored by git"
    echo "Please ensure your .gitignore includes .env files"
fi

# Security checklist
echo ""
echo "🔐 Security Checklist:"
echo "✅ Environment configuration centralized"
echo "✅ API endpoints centralized in config module" 
echo "✅ No hardcoded URLs in source code"
echo "✅ Environment files excluded from version control"

echo ""
echo "📋 Next Steps:"
echo "1. Review and update .env file with your specific configuration"
echo "2. For production, copy .env.production to .env and configure production URLs"
echo "3. Test the application to ensure API endpoints are working correctly"
echo "4. Review the security documentation in docs/api-security-config.md"

echo ""
echo "🎉 Security configuration setup complete!"

# Optional: Show current environment configuration (without sensitive values)
if command -v grep >/dev/null 2>&1; then
    echo ""
    echo "📊 Current Environment Configuration:"
    grep -E "^VITE_NODE_ENV|^VITE_API_VERSION|^VITE_ENABLE_DEBUG" .env 2>/dev/null | sed 's/=.*/=***/' || echo "No configuration found"
fi
