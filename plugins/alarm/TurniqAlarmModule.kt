package com.hirolifecreative.turniq.alarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Puente JS↔nativo para alarmas del sistema (setAlarmClock +
 * full-screen intent). Los IDs programados se guardan en
 * SharedPreferences para poder cancelarlos en bloque.
 */
class TurniqAlarmModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TurniqAlarm"

  private val prefs
    get() = reactContext.getSharedPreferences("turniq-alarm", Context.MODE_PRIVATE)

  private fun alarmIntent(id: String, shiftId: String, title: String, body: String, sound: String): Intent {
    return Intent(reactContext, AlarmReceiver::class.java).apply {
      action = "com.hirolifecreative.turniq.ALARM_FIRE"
      putExtra("id", id)
      putExtra("shiftId", shiftId)
      putExtra("title", title)
      putExtra("body", body)
      putExtra("sound", sound)
    }
  }

  private fun pendingBroadcast(id: String, intent: Intent): PendingIntent {
    return PendingIntent.getBroadcast(
      reactContext, id.hashCode(), intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  @ReactMethod
  fun scheduleAlarm(id: String, triggerAtMs: Double, shiftId: String, title: String, body: String, sound: String, promise: Promise) {
    try {
      val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val op = pendingBroadcast(id, alarmIntent(id, shiftId, title, body, sound))
      val launch = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
      val show = if (launch != null) {
        PendingIntent.getActivity(
          reactContext, 0, launch,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
      } else {
        op
      }
      // setAlarmClock: la vía de la alarma del sistema — exacta,
      // atraviesa Doze y NO requiere permiso de alarmas exactas.
      am.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMs.toLong(), show), op)
      val ids = (prefs.getStringSet("ids", mutableSetOf()) ?: mutableSetOf()).toMutableSet()
      ids.add(id)
      prefs.edit().putStringSet("ids", ids).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ALARM_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun cancelAlarm(id: String, promise: Promise) {
    try {
      val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pi = pendingBroadcast(id, alarmIntent(id, "", "", "", ""))
      am.cancel(pi)
      pi.cancel()
      val ids = (prefs.getStringSet("ids", mutableSetOf()) ?: mutableSetOf()).toMutableSet()
      ids.remove(id)
      prefs.edit().putStringSet("ids", ids).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ALARM_ERROR", e.message, e)
    }
  }

  /** Cancela todas las alarmas de avisos (conserva las pospuestas). */
  @ReactMethod
  fun cancelAllAlarms(promise: Promise) {
    try {
      val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val ids = (prefs.getStringSet("ids", mutableSetOf()) ?: mutableSetOf()).toMutableSet()
      for (id in ids) {
        if (id.startsWith("snooze-")) continue
        val pi = pendingBroadcast(id, alarmIntent(id, "", "", "", ""))
        am.cancel(pi)
        pi.cancel()
      }
      val keep = ids.filter { it.startsWith("snooze-") }.toMutableSet()
      prefs.edit().putStringSet("ids", keep).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ALARM_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    if (Build.VERSION.SDK_INT >= 34) {
      val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      promise.resolve(nm.canUseFullScreenIntent())
    } else {
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 34) {
        val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
          data = Uri.parse("package:" + reactContext.packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ALARM_ERROR", e.message, e)
    }
  }

  /** shiftId de la última alarma disparada (guardado por el receiver). */
  @ReactMethod
  fun getPendingAlarm(promise: Promise) {
    val shiftId = prefs.getString("pendingShiftId", null)
    val at = prefs.getLong("pendingAt", 0L)
    if (shiftId != null && shiftId.isNotEmpty() && System.currentTimeMillis() - at < 2 * 60 * 60 * 1000L) {
      promise.resolve(shiftId)
    } else {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun clearPendingAlarm(promise: Promise) {
    prefs.edit().remove("pendingShiftId").remove("pendingAt").apply()
    promise.resolve(true)
  }
}
