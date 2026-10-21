package com.hirolifecreative.turniq.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build

/**
 * Recibe la alarma de setAlarmClock y la presenta como notificación
 * con intent a PANTALLA COMPLETA (categoría alarma, prioridad máxima,
 * sonido del canal elegido). También deja registrado el shiftId para
 * que la app abra su pantalla de Alarma al entrar.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: "aviso"
    val shiftId = intent.getStringExtra("shiftId") ?: ""
    val title = intent.getStringExtra("title") ?: "Turniq"
    val body = intent.getStringExtra("body") ?: ""
    val sound = intent.getStringExtra("sound") ?: "clasica"

    val prefs = context.getSharedPreferences("turniq-alarm", Context.MODE_PRIVATE)
    prefs.edit()
      .putString("pendingShiftId", shiftId)
      .putLong("pendingAt", System.currentTimeMillis())
      .apply()
    val ids = (prefs.getStringSet("ids", mutableSetOf()) ?: mutableSetOf()).toMutableSet()
    ids.remove(id)
    prefs.edit().putStringSet("ids", ids).apply()

    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    // IDs PROPIOS (turniq-sistema-*): los canales turniq-alarma-* los crea
    // expo-notifications con otros ajustes y Android los congela para
    // siempre; si el receiver reutilizara ese canal, la alarma podría
    // quedar sin sonido. Estos nacen aquí con USAGE_ALARM garantizado.
    val channelId = "turniq-sistema-$sound"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (nm.getNotificationChannel(channelId) == null) {
        val file = when (sound) {
          "suave" -> "alarma_suave"
          "fuerte" -> "alarma_fuerte"
          else -> "alarma_clasica"
        }
        val resId = context.resources.getIdentifier(file, "raw", context.packageName)
        val ch = NotificationChannel(channelId, "Alarma Turniq", NotificationManager.IMPORTANCE_HIGH)
        if (resId != 0) {
          val audio = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
          ch.setSound(Uri.parse("android.resource://" + context.packageName + "/" + resId), audio)
        }
        ch.enableVibration(true)
        ch.vibrationPattern = longArrayOf(0, 250, 200, 250)
        ch.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        nm.createNotificationChannel(ch)
      }
    }

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(Intent.ACTION_MAIN).setPackage(context.packageName)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val fsi = PendingIntent.getActivity(
      context, id.hashCode(), launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, channelId)
    } else {
      Notification.Builder(context)
    }
    val notification = builder
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(Notification.CATEGORY_ALARM)
      .setPriority(Notification.PRIORITY_MAX)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setVibrate(longArrayOf(0, 250, 200, 250))
      .setAutoCancel(true)
      .setContentIntent(fsi)
      .setFullScreenIntent(fsi, true)
      .build()
    nm.notify(id.hashCode(), notification)
  }
}
