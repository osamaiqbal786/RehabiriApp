#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Automated Rehabiri App Icon Update (Node.js)');
console.log('===============================================');
console.log('');

// Check if source icons exist
const lightIcon = 'assets/images/rehabiri-light-icon.png';
const darkIcon = 'assets/images/rehabiri-dark-icon.png';

if (!fs.existsSync(lightIcon)) {
    console.log('❌ Error: rehabiri-light-icon.png not found!');
    console.log('Please make sure you have the icon files in the assets/images/ folder.');
    process.exit(1);
}

console.log('✅ Found source icon: rehabiri-light-icon.png');
console.log('');

// Create temporary directory for generated icons
const tempDir = `temp-icons-${Date.now()}`;
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

console.log(`📁 Created temporary directory: ${tempDir}`);
console.log('');

// Check if sharp is available (for image processing)
let useSharp = false;
try {
    require('sharp');
    useSharp = true;
    console.log('✅ Sharp found - will generate icons automatically');
} catch (error) {
    console.log('⚠️  Sharp not found - will use ImageMagick or provide manual instructions');
    console.log('');
    console.log('📦 To install Sharp: npm install sharp');
    console.log('🔄 Alternative: Use online tool at https://appicon.co/');
    console.log('   - Upload your rehabiri-light-icon.png');
    console.log('   - Download the generated pack');
    console.log('   - Extract to current directory');
    console.log('');
}

// Icon size definitions
const androidSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
};

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

// Function to generate icons using Sharp
async function generateIconsWithSharp() {
    const sharp = require('sharp');
    
    console.log('🤖 Generating Android icons...');
    for (const [folder, size] of Object.entries(androidSizes)) {
        await sharp(lightIcon)
            .resize(size, size)
            .png()
            .toFile(path.join(tempDir, `android-${size}.png`));
        console.log(`   ✅ Generated ${folder} (${size}x${size})`);
    }
    
    console.log('');
    console.log('🍎 Generating iOS icons...');
    for (const [filename, size] of Object.entries(iosSizes)) {
        await sharp(lightIcon)
            .resize(size, size)
            .png()
            .toFile(path.join(tempDir, `ios-${size}.png`));
        console.log(`   ✅ Generated ${filename} (${size}x${size})`);
    }
}

// Function to generate icons using ImageMagick
function generateIconsWithImageMagick() {
    try {
        execSync('convert -version', { stdio: 'ignore' });
        console.log('✅ ImageMagick found - generating icons...');
        
        console.log('🤖 Generating Android icons...');
        for (const [folder, size] of Object.entries(androidSizes)) {
            execSync(`convert "${lightIcon}" -resize ${size}x${size} "${path.join(tempDir, `android-${size}.png`)}"`);
            console.log(`   ✅ Generated ${folder} (${size}x${size})`);
        }
        
        console.log('');
        console.log('🍎 Generating iOS icons...');
        for (const [filename, size] of Object.entries(iosSizes)) {
            execSync(`convert "${lightIcon}" -resize ${size}x${size} "${path.join(tempDir, `ios-${size}.png`)}"`);
            console.log(`   ✅ Generated ${filename} (${size}x${size})`);
        }
    } catch (error) {
        console.log('❌ ImageMagick not found or failed');
        console.log('Please install ImageMagick or use the online tool at https://appicon.co/');
        process.exit(1);
    }
}

// Function to create backup
function createBackup() {
    const backupDir = `icon-backup-${Date.now()}`;
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    console.log('📦 Creating backup of current icons...');
    
    // Backup Android icons
    const androidResDir = 'android/app/src/main/res';
    if (fs.existsSync(androidResDir)) {
        const mipmapDirs = fs.readdirSync(androidResDir).filter(dir => dir.startsWith('mipmap-'));
        mipmapDirs.forEach(dir => {
            const srcPath = path.join(androidResDir, dir);
            const destPath = path.join(backupDir, dir);
            if (fs.existsSync(srcPath)) {
                fs.cpSync(srcPath, destPath, { recursive: true });
            }
        });
        console.log('   ✅ Android icons backed up');
    }
    
    // Backup iOS icons
    const iosAppIconDir = 'ios/RehabiriApp/Images.xcassets/AppIcon.appiconset';
    if (fs.existsSync(iosAppIconDir)) {
        const destPath = path.join(backupDir, 'AppIcon.appiconset');
        fs.cpSync(iosAppIconDir, destPath, { recursive: true });
        console.log('   ✅ iOS icons backed up');
    }
    
    return backupDir;
}

// Function to copy Android icons
function copyAndroidIcons() {
    console.log('');
    console.log('🤖 Copying Android icons...');
    
    for (const [folder, size] of Object.entries(androidSizes)) {
        const sourceFile = path.join(tempDir, `android-${size}.png`);
        const targetDir = `android/app/src/main/res/${folder}`;
        
        if (fs.existsSync(sourceFile) && fs.existsSync(targetDir)) {
            fs.copyFileSync(sourceFile, path.join(targetDir, 'ic_launcher.png'));
            fs.copyFileSync(sourceFile, path.join(targetDir, 'ic_launcher_round.png'));
            console.log(`   ✅ ${folder} (${size}x${size})`);
        }
    }
}

// Function to copy iOS icons
function copyIosIcons() {
    console.log('');
    console.log('🍎 Copying iOS icons...');
    
    const iosAppIconDir = 'ios/RehabiriApp/Images.xcassets/AppIcon.appiconset';
    
    for (const [filename, size] of Object.entries(iosSizes)) {
        const sourceFile = path.join(tempDir, `ios-${size}.png`);
        const targetFile = path.join(iosAppIconDir, filename);
        
        if (fs.existsSync(sourceFile) && fs.existsSync(iosAppIconDir)) {
            fs.copyFileSync(sourceFile, targetFile);
            console.log(`   ✅ ${filename} (${size}x${size})`);
        }
    }
}

// Function to clean up
function cleanup() {
    console.log('');
    console.log('🧹 Cleaning up temporary files...');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.log('   ✅ Temporary files removed');
}

// Main execution
async function main() {
    try {
        // Generate icons
        if (useSharp) {
            await generateIconsWithSharp();
        } else {
            generateIconsWithImageMagick();
        }
        
        // Create backup
        const backupDir = createBackup();
        
        // Copy icons
        copyAndroidIcons();
        copyIosIcons();
        
        // Clean up
        cleanup();
        
        console.log('');
        console.log('🎉 Icon update completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('==============');
        console.log('');
        console.log('1. 🧹 Clean and rebuild your app:');
        console.log('   # Android');
        console.log('   cd android && ./gradlew clean && cd ..');
        console.log('   npx react-native run-android');
        console.log('');
        console.log('   # iOS');
        console.log('   cd ios && xcodebuild clean && cd ..');
        console.log('   npx react-native run-ios');
        console.log('');
        console.log('2. 🔍 Verify the new icons appear correctly on both platforms');
        console.log('');
        console.log(`3. 💾 Your original icons are backed up in: ${backupDir}/`);
        console.log('');
        console.log('🚀 Happy coding with your new app icons!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        cleanup();
        process.exit(1);
    }
}

// Run the script
main();
