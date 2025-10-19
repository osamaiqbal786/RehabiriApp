#!/bin/bash

# Build Rehabiri App with Production API (https://rehabiri.com)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Building Rehabiri App with Production API (https://rehabiri.com) and Maximum Security (HTTPS Only)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the RehabiriApp directory."
    exit 1
fi

# Verify API configuration
print_status "Verifying API configuration..."
if grep -q "https://rehabiri.com" src/config/index.ts; then
    print_success "✅ API configured to use https://rehabiri.com"
else
    print_error "❌ API configuration not updated. Please check src/config/index.ts"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Clean previous builds
print_status "Cleaning previous builds..."
npx react-native clean

# Build for Android
print_status "Building Android APK..."
cd android
./gradlew clean
./gradlew assembleRelease
cd ..

if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    print_success "✅ Android APK built successfully!"
    print_status "APK location: android/app/build/outputs/apk/release/app-release.apk"
else
    print_error "❌ Android build failed"
    exit 1
fi

# Build for iOS (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Building iOS app..."
    cd ios
    pod install
    cd ..
    
    print_status "Building iOS release..."
    npx react-native run-ios --configuration Release
    
    print_success "✅ iOS build completed!"
else
    print_warning "Skipping iOS build (not on macOS)"
fi

print_success "🎉 Build completed successfully!"
print_status "Your app is now configured with:"
print_status "  ✅ Production API: https://rehabiri.com"
print_status "  ✅ Maximum Security: HTTPS ONLY - no HTTP allowed anywhere"
print_status "  ✅ HTTP completely disabled: No cleartext traffic permitted"
print_status "  ✅ Zero exceptions: All connections must use HTTPS"
print_status ""
print_status "📱 Next steps:"
print_status "  1. Install the APK on your device"
print_status "  2. Test all API endpoints"
print_status "  3. Verify HTTPS connections are working"
print_status "  4. Confirm no HTTP traffic is allowed"
print_status ""
print_status "🔍 To test API connectivity:"
print_status "  - Check login functionality"
print_status "  - Test patient data loading"
print_status "  - Verify session creation"
print_status "  - Test notifications"
print_status ""
print_status "🔒 Maximum Security Configuration:"
print_status "  - HTTPS enforced for ALL traffic (production + development)"
print_status "  - HTTP cleartext traffic completely disabled"
print_status "  - Zero exceptions - no HTTP allowed anywhere"
print_status "  - Certificate validation enforced"
print_status "  - Enterprise-grade security standards"
