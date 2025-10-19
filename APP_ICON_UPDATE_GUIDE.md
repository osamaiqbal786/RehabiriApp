# 🎨 App Icon Update Guide

This guide will help you update the Rehabiri app icon for both Android and iOS using your new icon files.

## 📁 Your Icon Files

You have these icon files ready:
- `assets/images/rehabiri-light-icon.png` - Light theme icon
- `assets/images/rehabiri-dark-icon.png` - Dark theme icon

## 🚀 Quick Start (Recommended)

### Option 1: Automated Icon Generator (Easiest)

1. **Go to [appicon.co](https://appicon.co/)**
2. **Upload your `rehabiri-light-icon.png`**
3. **Select platforms**: Android + iOS
4. **Download the generated icon pack**
5. **Extract the zip file**

### Option 2: Manual Process

Follow the detailed steps below.

## 📱 Android Icon Update

### Required Sizes:
- `mipmap-mdpi/ic_launcher.png` - 48x48px
- `mipmap-hdpi/ic_launcher.png` - 72x72px  
- `mipmap-xhdpi/ic_launcher.png` - 96x96px
- `mipmap-xxhdpi/ic_launcher.png` - 144x144px
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192px

### Steps:
1. **Generate all sizes** from your source icon
2. **Copy to Android folders**:
   ```bash
   # Copy to each density folder
   cp icon-48.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
   cp icon-72.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
   cp icon-96.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
   cp icon-144.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
   cp icon-192.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
   ```
3. **Also copy round versions** (ic_launcher_round.png)

## 🍎 iOS Icon Update

### Required Sizes:
- `Icon-App-20x20@1x.png` - 20x20px
- `Icon-App-20x20@2x.png` - 40x40px
- `Icon-App-20x20@3x.png` - 60x60px
- `Icon-App-29x29@1x.png` - 29x29px
- `Icon-App-29x29@2x.png` - 58x58px
- `Icon-App-29x29@3x.png` - 87x87px
- `Icon-App-40x40@1x.png` - 40x40px
- `Icon-App-40x40@2x.png` - 80x80px
- `Icon-App-40x40@3x.png` - 120x120px
- `Icon-App-60x60@2x.png` - 120x120px
- `Icon-App-60x60@3x.png` - 180x180px
- `Icon-App-76x76@1x.png` - 76x76px
- `Icon-App-76x76@2x.png` - 152x152px
- `Icon-App-83.5x83.5@2x.png` - 167x167px
- `Icon-App-1024x1024@1x.png` - 1024x1024px

### Steps:
1. **Generate all sizes** from your source icon
2. **Copy to iOS folder**:
   ```bash
   # Copy all iOS icons to the appiconset folder
   cp Icon-App-*.png ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/
   ```

## 🛠️ Tools for Icon Generation

### Online Tools (Recommended):
- **[appicon.co](https://appicon.co/)** - Generates all sizes automatically
- **[makeappicon.com](https://makeappicon.com/)** - Another great option
- **[icon.kitchen](https://icon.kitchen/)** - Google's icon generator

### Desktop Tools:
- **Adobe Photoshop/Illustrator**
- **GIMP** (free)
- **Sketch** (Mac only)
- **Figma** (free, web-based)

## 🧹 Clean and Rebuild

After updating the icons:

### Android:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### iOS:
```bash
cd ios
xcodebuild clean
cd ..
npx react-native run-ios
```

## 🔍 Verification

1. **Android**: Check the app icon on your device/emulator
2. **iOS**: Check the app icon on your device/simulator
3. **Both**: Verify the icon appears correctly in the app drawer/home screen

## 🆘 Troubleshooting

### Icon not updating:
1. **Clean build cache**: `npx react-native start --reset-cache`
2. **Uninstall and reinstall** the app
3. **Check file names** match exactly
4. **Verify file sizes** are correct

### Icon appears blurry:
1. **Check resolution** - ensure you're using the correct size
2. **Verify file format** - should be PNG
3. **Check compression** - avoid over-compression

## 📝 Notes

- **Use the light icon** (`rehabiri-light-icon.png`) as your primary source
- **Keep backups** of your original icons
- **Test on both platforms** after updating
- **Consider dark mode** - you might want different icons for light/dark themes

## 🎯 Quick Commands

```bash
# Run the helper script
./scripts/update-icons.sh

# Clean and rebuild Android
cd android && ./gradlew clean && cd .. && npx react-native run-android

# Clean and rebuild iOS  
cd ios && xcodebuild clean && cd .. && npx react-native run-ios
```

---

**Need help?** Check the React Native documentation or create an issue in your project repository.
