#!/bin/bash

# Setup and Update App Icons Script
# This script installs dependencies and updates app icons automatically

echo "🎨 Rehabiri App Icon Setup & Update"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the RehabiriApp directory"
    exit 1
fi

echo "✅ Found RehabiriApp directory"
echo ""

# Check if source icons exist
LIGHT_ICON="assets/images/rehabiri-light-icon.png"
if [ ! -f "$LIGHT_ICON" ]; then
    echo "❌ Error: $LIGHT_ICON not found!"
    echo "Please make sure you have the icon files in the assets/images/ folder."
    exit 1
fi

echo "✅ Found source icon: $LIGHT_ICON"
echo ""

# Install Sharp for image processing
echo "📦 Installing Sharp for image processing..."
if npm list sharp > /dev/null 2>&1; then
    echo "   ✅ Sharp already installed"
else
    echo "   📥 Installing Sharp..."
    npm install sharp --save-dev
    if [ $? -eq 0 ]; then
        echo "   ✅ Sharp installed successfully"
    else
        echo "   ⚠️  Failed to install Sharp, will try ImageMagick"
    fi
fi

echo ""

# Run the automated icon update
echo "🚀 Running automated icon update..."
echo ""

# Try Node.js version first
if command -v node &> /dev/null; then
    echo "📱 Using Node.js version..."
    node scripts/auto-update-icons.js
else
    echo "📱 Using Bash version..."
    ./scripts/auto-update-icons.sh
fi

echo ""
echo "🎉 Icon update process completed!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "✅ Dependencies installed"
echo "✅ Icons generated and copied"
echo "✅ Backups created"
echo ""
echo "🚀 Next: Clean and rebuild your app to see the new icons!"
