# Firebase Cloud Messaging Setup - iOS Production Checklist

## Prerequisites
- [ ] Apple Developer Account ($99/year) - **REQUIRED**
- [ ] Firebase project configured
- [ ] GoogleService-Info.plist added to project

## Step 1: Configure Xcode Project
- [ ] Open Xcode → Select RehabiriApp project → RehabiriApp target
- [ ] Go to "Signing & Capabilities" tab
- [ ] Add "Push Notifications" capability
- [ ] Add "Background Modes" capability
- [ ] In Background Modes, check "Remote notifications"
- [ ] Verify "Automatically manage signing" is ON
- [ ] Select your paid Apple Developer Team

## Step 2: Create APNs Authentication Key
- [ ] Go to https://developer.apple.com/account/
- [ ] Navigate to "Certificates, Identifiers & Profiles" → "Keys"
- [ ] Click "+" to create new key
- [ ] Name: "APNs Key for RehabiriApp"
- [ ] Check "Apple Push Notifications service (APNs)"
- [ ] Click "Continue" → "Register"
- [ ] Download the `.p8` file (save securely)
- [ ] Note down Key ID: `___________`
- [ ] Note down Team ID: `___________`

## Step 3: Configure Firebase Console
- [ ] Go to https://console.firebase.google.com/
- [ ] Select your project → "Project Settings" (gear icon)
- [ ] Click "Cloud Messaging" tab
- [ ] Under "APNs Authentication Key" section:
  - [ ] Upload the `.p8` file
  - [ ] Enter Key ID
  - [ ] Enter Team ID
  - [ ] Click "Upload"

## Step 4: Test the Setup
- [ ] Build and run app on physical device
- [ ] Check logs for successful FCM token:
  ```
  ✅ FCM registration token: [actual token]
  📱 APNs token registered
  ```
- [ ] Verify no more entitlement warnings

## Step 5: Send Test Notification
- [ ] Go to Firebase Console → "Cloud Messaging"
- [ ] Click "Send your first message"
- [ ] Enter notification title and text
- [ ] Click "Send test message"
- [ ] Enter the FCM token from app logs
- [ ] Send the notification
- [ ] Verify notification appears on device

## Step 6: Verify Complete Functionality
- [ ] App receives notifications when in background
- [ ] App receives notifications when in foreground
- [ ] Tapping notifications opens the app
- [ ] FCM token is generated and sent to server
- [ ] No more "aps-environment" errors

## Expected Logs After Setup
```
🔧 Starting FCM initialization...
🔧 Requesting iOS notification permissions...
🔧 iOS permission status: 1
✅ iOS notification permissions granted
🔧 Getting FCM token...
🔧 FCM token received: Yes
🔧 Storing FCM token...
🔧 Sending FCM token to server...
✅ FCM initialization completed successfully
📱 FCM registration token: [actual-token-here]
📱 APNs token registered
```

## Troubleshooting
- **If still getting entitlement errors**: Check that Push Notifications capability is added
- **If no FCM token**: Verify APNs key is uploaded to Firebase Console
- **If notifications not received**: Check device notification settings
- **If build fails**: Ensure paid Apple Developer account is selected in Xcode

## Notes
- Your existing FCM code is production-ready
- No code changes needed after getting paid developer account
- Development builds will continue to show warnings (this is normal)
- Production builds will work with proper entitlements

---
**Status**: Ready for production setup
**Last Updated**: [Current Date]
