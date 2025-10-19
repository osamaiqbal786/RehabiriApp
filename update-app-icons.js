#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icon sizes needed for Android
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Icon sizes needed for iOS
const iosSizes = {
  'Icon-App-20x20@1x.png': 20,
  'Icon-App-20x20@2x.png': 40,
  'Icon-App-20x20@3x.png': 60,
  'Icon-App-29x29@1x.png': 29,
  'Icon-App-29x29@2x.png': 58,
  'Icon-App-29x29@3x.png': 87,
  'Icon-App-40x40@1x.png': 40,
  'Icon-App-40x40@2x.png': 80,
  'Icon-App-40x40@3x.png': 120,
  'Icon-App-60x60@2x.png': 120,
  'Icon-App-60x60@3x.png': 180,
  'Icon-App-76x76@1x.png': 76,
  'Icon-App-76x76@2x.png': 152,
  'Icon-App-83.5x83.5@2x.png': 167,
  'Icon-App-1024x1024@1x.png': 1024
};

console.log('🎨 App Icon Update Script');
console.log('========================');
console.log('');
console.log('This script will help you update your app icons.');
console.log('');
console.log('📱 Required icon sizes:');
console.log('');
console.log('Android:');
Object.entries(androidSizes).forEach(([folder, size]) => {
  console.log(`  ${folder}: ${size}x${size}px`);
});
console.log('');
console.log('iOS:');
Object.entries(iosSizes).forEach(([filename, size]) => {
  console.log(`  ${filename}: ${size}x${size}px`);
});
console.log('');
console.log('📋 Steps to update your app icons:');
console.log('');
console.log('1. Use an online icon generator or image editing tool to create all required sizes');
console.log('2. Recommended tools:');
console.log('   - https://appicon.co/ (generates all sizes automatically)');
console.log('   - https://makeappicon.com/ (generates all sizes automatically)');
console.log('   - Adobe Photoshop/Illustrator');
console.log('   - GIMP (free)');
console.log('');
console.log('3. For Android:');
console.log('   - Generate icons for each density folder');
console.log('   - Replace files in android/app/src/main/res/mipmap-*/');
console.log('');
console.log('4. For iOS:');
console.log('   - Generate icons for each size');
console.log('   - Replace files in ios/RehabiriApp/Images.xcassets/AppIcon.appiconset/');
console.log('');
console.log('5. Clean and rebuild your app:');
console.log('   - Android: cd android && ./gradlew clean && cd ..');
console.log('   - iOS: cd ios && xcodebuild clean && cd ..');
console.log('');
console.log('💡 Pro tip: Use your rehabiri-light-icon.png as the base image for generation!');
console.log('');
console.log('🚀 After updating icons, run:');
console.log('   npx react-native run-android');
console.log('   npx react-native run-ios');
