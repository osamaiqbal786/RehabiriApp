package com.rehabiriapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Rehabiri"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    createNotificationChannel()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channelId = "rehabiri-notifications"
      val channelName = "Rehabiri Notifications"
      val channelDescription = "Notifications for Rehabiri app"
      val importance = NotificationManager.IMPORTANCE_HIGH
      
      val channel = NotificationChannel(channelId, channelName, importance).apply {
        description = channelDescription
        enableLights(true)
        enableVibration(true)
        // Don't set sound to null, let it use default
      }
      
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      
      // Check if channel already exists
      val existingChannel = notificationManager.getNotificationChannel(channelId)
      if (existingChannel == null) {
        notificationManager.createNotificationChannel(channel)
        android.util.Log.d("MainActivity", "Notification channel created: $channelId")
        android.util.Log.d("MainActivity", "Channel importance: ${channel.importance}")
        android.util.Log.d("MainActivity", "Channel lights enabled: ${channel.shouldShowLights()}")
        android.util.Log.d("MainActivity", "Channel vibration enabled: ${channel.shouldVibrate()}")
      } else {
        android.util.Log.d("MainActivity", "Notification channel already exists: $channelId")
        android.util.Log.d("MainActivity", "Existing channel importance: ${existingChannel.importance}")
      }
    } else {
      android.util.Log.d("MainActivity", "Android version too old for notification channels")
    }
  }
}
