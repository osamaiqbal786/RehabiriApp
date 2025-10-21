#!/bin/bash

# Automated App Icon Update Script for Rehabiri
# This script generates all required icon sizes and copies them to the correct locations

echo "🎨 Automated Rehabiri App Icon Update"
echo "====================================="
echo ""

# Check if source icons exist
LIGHT_ICON="assets/images/rehabiri-light-icon.png"
DARK_ICON="assets/images/rehabiri-dark-icon.png"

if [ ! -f "$LIGHT_ICON" ]; then
    echo "❌ Error: $LIGHT_ICON not found!"
    echo "Please make sure you have the icon files in the assets/images/ folder."
    exit 1
fi

echo "✅ Found source icon: $LIGHT_ICON"
echo ""

# Create temporary directory for generated icons
TEMP_DIR="temp-icons-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "📁 Created temporary directory: $TEMP_DIR"
echo ""

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick found - will generate icons automatically"
    echo ""
    
    # Android icon sizes
    echo "🤖 Generating Android icons..."
    convert "$LIGHT_ICON" -resize 48x48 "$TEMP_DIR/android-48.png"
    convert "$LIGHT_ICON" -resize 72x72 "$TEMP_DIR/android-72.png"
    convert "$LIGHT_ICON" -resize 96x96 "$TEMP_DIR/android-96.png"
    convert "$LIGHT_ICON" -resize 144x144 "$TEMP_DIR/android-144.png"
    convert "$LIGHT_ICON" -resize 192x192 "$TEMP_DIR/android-192.png"
    echo "   ✅ Android icons generated"
    
    # iOS icon sizes
    echo "🍎 Generating iOS icons..."
    convert "$LIGHT_ICON" -resize 20x20 "$TEMP_DIR/ios-20.png"
    convert "$LIGHT_ICON" -resize 40x40 "$TEMP_DIR/ios-40.png"
    convert "$LIGHT_ICON" -resize 60x60 "$TEMP_DIR/ios-60.png"
    convert "$LIGHT_ICON" -resize 29x29 "$TEMP_DIR/ios-29.png"
    convert "$LIGHT_ICON" -resize 58x58 "$TEMP_DIR/ios-58.png"
    convert "$LIGHT_ICON" -resize 87x87 "$TEMP_DIR/ios-87.png"
    convert "$LIGHT_ICON" -resize 80x80 "$TEMP_DIR/ios-80.png"
    convert "$LIGHT_ICON" -resize 120x120 "$TEMP_DIR/ios-120.png"
    convert "$LIGHT_ICON" -resize 180x180 "$TEMP_DIR/ios-180.png"
    convert "$LIGHT_ICON" -resize 76x76 "$TEMP_DIR/ios-76.png"
    convert "$LIGHT_ICON" -resize 152x152 "$TEMP_DIR/ios-152.png"
    convert "$LIGHT_ICON" -resize 167x167 "$TEMP_DIR/ios-167.png"
    convert "$LIGHT_ICON" -resize 1024x1024 "$TEMP_DIR/ios-1024.png"
    echo "   ✅ iOS icons generated"
    
else
    echo "⚠️  ImageMagick not found - will provide manual instructions"
    echo ""
    echo "📋 To install ImageMagick:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/"
    echo ""
    echo "🔄 Alternative: Use online tool at https://appicon.co/"
    echo "   - Upload your $LIGHT_ICON"
    echo "   - Download the generated pack"
    echo "   - Extract to $TEMP_DIR/"
    echo ""
    read -p "Press Enter after you've generated the icons manually..."
fi

# Create backup of current icons
echo ""
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

# Copy Android icons
echo ""
echo "🤖 Copying Android icons..."

if [ -f "$TEMP_DIR/android-48.png" ]; then
    cp "$TEMP_DIR/android-48.png" android/app/src/main/res/mipmap-mdpi/ic_launcher.png
    cp "$TEMP_DIR/android-48.png" android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
    echo "   ✅ mipmap-mdpi (48x48)"
fi

if [ -f "$TEMP_DIR/android-72.png" ]; then
    cp "$TEMP_DIR/android-72.png" android/app/src/main/res/mipmap-hdpi/ic_launcher.png
    cp "$TEMP_DIR/android-72.png" android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
    echo "   ✅ mipmap-hdpi (72x72)"
fi

if [ -f "$TEMP_DIR/android-96.png" ]; then
    cp "$TEMP_DIR/android-96.png" android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
    cp "$TEMP_DIR/android-96.png" android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
    echo "   ✅ mipmap-xhdpi (96x96)"
fi

if [ -f "$TEMP_DIR/android-144.png" ]; then
    cp "$TEMP_DIR/android-144.png" android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
    cp "$TEMP_DIR/android-144.png" android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
    echo "   ✅ mipmap-xxhdpi (144x144)"
fi

if [ -f "$TEMP_DIR/android-192.png" ]; then
    cp "$TEMP_DIR/android-192.png" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    cp "$TEMP_DIR/android-192.png" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
    echo "   ✅ mipmap-xxxhdpi (192x192)"
fi

# Copy iOS icons
echo ""
echo "🍎 Copying iOS icons..."

if [ -f "$TEMP_DIR/ios-20.png" ]; then
    cp "$TEMP_DIR/ios-20.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png
    echo "   ✅ Icon-App-20x20@1x.png (20x20)"
fi

if [ -f "$TEMP_DIR/ios-40.png" ]; then
    cp "$TEMP_DIR/ios-40.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png
    echo "   ✅ Icon-App-20x20@2x.png (40x40)"
fi

if [ -f "$TEMP_DIR/ios-60.png" ]; then
    cp "$TEMP_DIR/ios-60.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png
    echo "   ✅ Icon-App-20x20@3x.png (60x60)"
fi

if [ -f "$TEMP_DIR/ios-29.png" ]; then
    cp "$TEMP_DIR/ios-29.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png
    echo "   ✅ Icon-App-29x29@1x.png (29x29)"
fi

if [ -f "$TEMP_DIR/ios-58.png" ]; then
    cp "$TEMP_DIR/ios-58.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png
    echo "   ✅ Icon-App-29x29@2x.png (58x58)"
fi

if [ -f "$TEMP_DIR/ios-87.png" ]; then
    cp "$TEMP_DIR/ios-87.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png
    echo "   ✅ Icon-App-29x29@3x.png (87x87)"
fi

if [ -f "$TEMP_DIR/ios-40.png" ]; then
    cp "$TEMP_DIR/ios-40.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png
    echo "   ✅ Icon-App-40x40@1x.png (40x40)"
fi

if [ -f "$TEMP_DIR/ios-80.png" ]; then
    cp "$TEMP_DIR/ios-80.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png
    echo "   ✅ Icon-App-40x40@2x.png (80x80)"
fi

if [ -f "$TEMP_DIR/ios-120.png" ]; then
    cp "$TEMP_DIR/ios-120.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png
    echo "   ✅ Icon-App-40x40@3x.png (120x120)"
fi

if [ -f "$TEMP_DIR/ios-120.png" ]; then
    cp "$TEMP_DIR/ios-120.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png
    echo "   ✅ Icon-App-60x60@2x.png (120x120)"
fi

if [ -f "$TEMP_DIR/ios-180.png" ]; then
    cp "$TEMP_DIR/ios-180.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png
    echo "   ✅ Icon-App-60x60@3x.png (180x180)"
fi

if [ -f "$TEMP_DIR/ios-76.png" ]; then
    cp "$TEMP_DIR/ios-76.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png
    echo "   ✅ Icon-App-76x76@1x.png (76x76)"
fi

if [ -f "$TEMP_DIR/ios-152.png" ]; then
    cp "$TEMP_DIR/ios-152.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png
    echo "   ✅ Icon-App-76x76@2x.png (152x152)"
fi

if [ -f "$TEMP_DIR/ios-167.png" ]; then
    cp "$TEMP_DIR/ios-167.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png
    echo "   ✅ Icon-App-83.5x83.5@2x.png (167x167)"
fi

if [ -f "$TEMP_DIR/ios-1024.png" ]; then
    cp "$TEMP_DIR/ios-1024.png" ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png
    echo "   ✅ Icon-App-1024x1024@1x.png (1024x1024)"
fi

# Clean up temporary directory
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
echo "   ✅ Temporary files removed"

echo ""
echo "🎉 Icon update completed successfully!"
echo ""
echo "📋 Next steps:"
echo "=============="
echo ""
echo "1. 🧹 Clean and rebuild your app:"
echo "   # Android"
echo "   cd android && ./gradlew clean && cd .."
echo "   npx react-native run-android"
echo ""
echo "   # iOS"
echo "   cd ios && xcodebuild clean && cd .."
echo "   npx react-native run-ios"
echo ""
echo "2. 🔍 Verify the new icons appear correctly on both platforms"
echo ""
echo "3. 💾 Your original icons are backed up in: $BACKUP_DIR/"
echo ""
echo "🚀 Happy coding with your new app icons!"
