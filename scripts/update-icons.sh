#!/bin/bash

# App Icon Update Script for Rehabiri
# This script helps you update app icons for both Android and iOS

echo "🎨 Rehabiri App Icon Update Script"
echo "=================================="
echo ""

# Check if source icons exist
LIGHT_ICON="assets/images/rehabiri-light-icon.png"
DARK_ICON="assets/images/rehabiri-dark-icon.png"

if [ ! -f "$LIGHT_ICON" ]; then
    echo "❌ Error: $LIGHT_ICON not found!"
    echo "Please make sure you have the icon files in the assets/images/ folder."
    exit 1
fi

if [ ! -f "$DARK_ICON" ]; then
    echo "❌ Error: $DARK_ICON not found!"
    echo "Please make sure you have the icon files in the assets/images/ folder."
    exit 1
fi

echo "✅ Found icon files:"
echo "   - $LIGHT_ICON"
echo "   - $DARK_ICON"
echo ""

# Create backup of current icons
echo "📦 Creating backup of current icons..."
BACKUP_DIR="icon-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Android icons
if [ -d "android/app/src/main/res/mipmap-hdpi" ]; then
    cp -r android/app/src/main/res/mipmap-* "$BACKUP_DIR/" 2>/dev/null || true
    echo "   ✅ Android icons backed up to $BACKUP_DIR/"
fi

# Backup iOS icons
if [ -d "ios/RehabiriApp/Images.xcassets/AppIcon.appiconset" ]; then
    cp -r ios/RehabiriApp/Images.xcassets/AppIcon.appiconset "$BACKUP_DIR/" 2>/dev/null || true
    echo "   ✅ iOS icons backed up to $BACKUP_DIR/"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🎨 Generate all required icon sizes:"
echo "   - Use https://appicon.co/ or https://makeappicon.com/"
echo "   - Upload your $LIGHT_ICON as the source"
echo "   - Download the generated icon pack"
echo ""
echo "2. 📱 For Android:"
echo "   - Extract the Android icons from the generated pack"
echo "   - Copy them to the respective mipmap folders:"
echo "     • mipmap-mdpi/ic_launcher.png (48x48)"
echo "     • mipmap-hdpi/ic_launcher.png (72x72)"
echo "     • mipmap-xhdpi/ic_launcher.png (96x96)"
echo "     • mipmap-xxhdpi/ic_launcher.png (144x144)"
echo "     • mipmap-xxxhdpi/ic_launcher.png (192x192)"
echo "   - Also copy the round versions (ic_launcher_round.png)"
echo ""
echo "3. 🍎 For iOS:"
echo "   - Extract the iOS icons from the generated pack"
echo "   - Copy them to ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/"
echo "   - Replace all the Icon-App-*.png files"
echo ""
echo "4. 🧹 Clean and rebuild:"
echo "   - Android: cd android && ./gradlew clean && cd .."
echo "   - iOS: cd ios && xcodebuild clean && cd .."
echo ""
echo "5. 🚀 Test the new icons:"
echo "   - npx react-native run-android"
echo "   - npx react-native run-ios"
echo ""
echo "💡 Tip: Your current icons are backed up in $BACKUP_DIR/"
echo ""
echo "🎯 Recommended icon generator: https://appicon.co/"
echo "   - Upload your $LIGHT_ICON"
echo "   - Select both Android and iOS"
echo "   - Download and extract the generated files"
