import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase
    FirebaseApp.configure()
    
    // Set Firebase Messaging delegate
    Messaging.messaging().delegate = self
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Rehabiri",
      in: window,
      launchOptions: launchOptions
    )

    // Set notification center delegate
    UNUserNotificationCenter.current().delegate = self

    // Request notification permissions
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      if granted {
        print("✅ Notification permission granted")
        DispatchQueue.main.async {
          UIApplication.shared.registerForRemoteNotifications()
        }
      } else {
        print("❌ Notification permission denied: \(error?.localizedDescription ?? "Unknown error")")
      }
    }

    return true
  }

  // Handle notification when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    print("📱 Notification received in foreground: \(notification.request.content.title)")
    completionHandler([.alert, .badge, .sound])
  }

  // Handle notification when user taps on it
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    print("📱 Notification tapped: \(response.notification.request.content.title)")
    completionHandler()
  }
  
  // MARK: - APNs Token Handling
  
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    print("📱 APNs token registered")
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
  }
  
  // MARK: - MessagingDelegate
  
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("📱 FCM registration token: \(fcmToken ?? "nil")")
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
