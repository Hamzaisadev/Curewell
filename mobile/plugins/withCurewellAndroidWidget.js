const { withAndroidManifest, withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Curewell Native Android Features:
 * 1. Native Android Home-Screen Widget (CurewellDoseWidgetProvider)
 * 2. Exact Offline Medication Alarm Receiver (CurewellAlarmReceiver) with Lock-Screen Actions
 * 3. System Boot Rescheduler Receiver (CurewellBootReceiver)
 * 4. React Native Bridge Module (CurewellNativeModule & CurewellNativePackage)
 */
function withCurewellAndroidWidget(config) {
  // 1. Add Receiver & Widget Provider entries to AndroidManifest.xml
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const app = manifest.application?.[0];
    if (!app) return modConfig;

    app.receiver = app.receiver || [];

    // Filter out previous entries to make it idempotent
    app.receiver = app.receiver.filter(
      (r) =>
        r.$?.['android:name'] !== '.CurewellDoseWidgetProvider' &&
        r.$?.['android:name'] !== '.CurewellAlarmReceiver' &&
        r.$?.['android:name'] !== '.CurewellBootReceiver'
    );

    // Ensure CurewellDoseWidgetProvider is registered
    app.receiver.push({
      $: {
        'android:name': '.CurewellDoseWidgetProvider',
        'android:exported': 'true',
        'android:label': 'Curewell Daily Schedule',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            { $: { 'android:name': 'com.curewell.health.ACTION_WIDGET_REFRESH' } },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/curewell_dose_widget_info',
          },
        },
      ],
    });

    // CurewellAlarmReceiver: android:exported="false" to prevent external malicious alarm injection/dismissal
    app.receiver.push({
      $: {
        'android:name': '.CurewellAlarmReceiver',
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'com.curewell.health.ACTION_DOSE_ALARM' } },
            { $: { 'android:name': 'com.curewell.health.ACTION_MARK_TAKEN' } },
            { $: { 'android:name': 'com.curewell.health.ACTION_SNOOZE_DOSE' } },
          ],
        },
      ],
    });

    // CurewellBootReceiver: android:exported="true" for system boot completion
    app.receiver.push({
      $: {
        'android:name': '.CurewellBootReceiver',
        'android:exported': 'true',
        'android:enabled': 'true',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
            { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
            { $: { 'android:name': 'com.htc.intent.action.QUICKBOOT_POWERON' } },
          ],
        },
      ],
    });

    return modConfig;
  });

  // 2. Register CurewellNativePackage in MainApplication.kt
  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('CurewellNativePackage()')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n              add(CurewellNativePackage())`
      );
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });

  // 3. Write Kotlin & XML resource files into android/app/src/main/
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.platformProjectRoot;
      const javaDir = path.join(
        projectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'curewell',
        'health'
      );
      const resXmlDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'xml');
      const resLayoutDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'layout');
      const resDrawableDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'drawable');

      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(resXmlDir, { recursive: true });
      fs.mkdirSync(resLayoutDir, { recursive: true });
      fs.mkdirSync(resDrawableDir, { recursive: true });

      // Widget background drawable
      fs.writeFileSync(
        path.join(resDrawableDir, 'curewell_widget_bg.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#0F172A" />
    <corners android:radius="20dp" />
    <stroke android:width="1.5dp" android:color="#0D9488" />
</shape>
`
      );

      // Widget info XML
      fs.writeFileSync(
        path.join(resXmlDir, 'curewell_dose_widget_info.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/curewell_dose_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
`
      );

      // Widget layout XML
      fs.writeFileSync(
        path.join(resLayoutDir, 'curewell_dose_widget.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="14dp"
    android:background="@drawable/curewell_widget_bg">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="CUREWELL COMPANION"
            android:textColor="#2DD4BF"
            android:textSize="11sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/widget_adherence"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="0/0 Doses (0%)"
            android:textColor="#34D399"
            android:textSize="11sp"
            android:textStyle="bold" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_next_dose"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="6dp"
        android:text="Next: Open app to sync schedule"
        android:textColor="#FFFFFF"
        android:textSize="14sp"
        android:textStyle="bold"
        android:maxLines="1"
        android:ellipsize="end" />

    <TextView
        android:id="@+id/widget_patient_meta"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="3dp"
        android:text="Tap to log doses, vitals, or view Emergency SOS ID"
        android:textColor="#94A3B8"
        android:textSize="11sp"
        android:maxLines="1"
        android:ellipsize="end" />
</LinearLayout>
`
      );

      // CurewellDoseWidgetProvider.kt
      fs.writeFileSync(
        path.join(javaDir, 'CurewellDoseWidgetProvider.kt'),
        `package com.curewell.health

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class CurewellDoseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.curewell.health.ACTION_WIDGET_REFRESH" ||
            intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, CurewellDoseWidgetProvider::class.java))
            if (ids != null && ids.isNotEmpty()) {
                onUpdate(context, manager, ids)
            }
        }
    }

    companion object {
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences("curewell_companion_prefs", Context.MODE_PRIVATE)
            val profileName = prefs.getString("profile_name", "Curewell Companion") ?: "Curewell Companion"
            val adherence = prefs.getString("adherence_summary", "0/0 Taken") ?: "0/0 Taken"
            val nextDose = prefs.getString("next_dose_text", "All scheduled doses logged for today") ?: "All scheduled doses logged for today"
            val emergencyMeta = prefs.getString("emergency_meta", "Tap to open schedule or log vitals") ?: "Tap to open schedule or log vitals"

            val views = RemoteViews(context.packageName, R.layout.curewell_dose_widget)
            views.setTextViewText(R.id.widget_title, "CUREWELL • \${profileName.uppercase()}")
            views.setTextViewText(R.id.widget_adherence, adherence)
            views.setTextViewText(R.id.widget_next_dose, nextDose)
            views.setTextViewText(R.id.widget_patient_meta, emergencyMeta)

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
`
      );

      // CurewellAlarmReceiver.kt
      fs.writeFileSync(
        path.join(javaDir, 'CurewellAlarmReceiver.kt'),
        `package com.curewell.health

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class CurewellAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "curewell_dose_alarms"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existingChannel = notificationManager.getNotificationChannel(channelId)
            if (existingChannel == null) {
                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()

                val channel = NotificationChannel(
                    channelId,
                    "Curewell Medication Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Offline scheduled medication dose alarms and reminders"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                    setSound(soundUri, audioAttributes)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    try {
                        setBypassDnd(true)
                    } catch (e: Exception) {
                        // Safe fallback if OEM restricts programmatic DND bypass
                    }
                }
                notificationManager.createNotificationChannel(channel)
            }
        }

        if (action == ACTION_MARK_TAKEN) {
            val notifId = intent.getIntExtra("notif_id", 1001)
            val doseId = intent.getStringExtra("dose_id") ?: notifId.toString()
            notificationManager.cancel(notifId)
            removeSavedAlarm(context, notifId)

            val prefs = context.getSharedPreferences(PREFS_COMPANION, Context.MODE_PRIVATE)
            val currentSet = prefs.getStringSet("unconfirmed_taken_doses", null) ?: emptySet()
            val updatedSet = HashSet(currentSet)
            updatedSet.add(doseId)

            var currentTaken = prefs.getInt("taken_count", 0)
            val totalCount = prefs.getInt("total_count", 0)
            currentTaken += 1

            val editor = prefs.edit()
            editor.putStringSet("unconfirmed_taken_doses", updatedSet)
            editor.putInt("taken_count", currentTaken)
            if (totalCount > 0) {
                val displayTaken = Math.min(currentTaken, totalCount)
                val pct = Math.round((displayTaken.toFloat() / totalCount.toFloat()) * 100)
                editor.putString("adherence_summary", "\$displayTaken/\$totalCount Taken (\$pct%)")
            } else {
                editor.putString("adherence_summary", "\$currentTaken Taken")
            }
            editor.apply()

            val refreshIntent = Intent(context, CurewellDoseWidgetProvider::class.java).apply {
                this.action = ACTION_WIDGET_REFRESH
            }
            context.sendBroadcast(refreshIntent)
            return
        }

        if (action == ACTION_SNOOZE_DOSE) {
            val notifId = intent.getIntExtra("notif_id", 1001)
            val title = intent.getStringExtra("title") ?: "Snoozed Medication Alarm"
            val body = intent.getStringExtra("body") ?: "Time for your scheduled dose"
            notificationManager.cancel(notifId)
            scheduleAlarm(
                context,
                notifId,
                System.currentTimeMillis() + 10 * 60 * 1000,
                title,
                body
            )
            return
        }

        if (action == ACTION_DOSE_ALARM) {
            val title = intent.getStringExtra("title") ?: "Time for your Scheduled Medicine"
            val body = intent.getStringExtra("body") ?: "Tap to confirm your dose in Curewell Companion."
            val notifId = intent.getIntExtra("notif_id", (System.currentTimeMillis() % 10000).toInt())
            val doseId = intent.getStringExtra("dose_id") ?: notifId.toString()

            // Remove from vault since this alarm has just fired
            removeSavedAlarm(context, notifId)

            val openIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val openPending = if (openIntent != null) {
                PendingIntent.getActivity(
                    context,
                    notifId,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            } else null

            val takenIntent = Intent(context, CurewellAlarmReceiver::class.java).apply {
                this.action = ACTION_MARK_TAKEN
                putExtra("notif_id", notifId)
                putExtra("dose_id", doseId)
            }
            val takenPending = PendingIntent.getBroadcast(
                context,
                notifId * 10 + 1,
                takenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val snoozeIntent = Intent(context, CurewellAlarmReceiver::class.java).apply {
                this.action = ACTION_SNOOZE_DOSE
                putExtra("notif_id", notifId)
                putExtra("title", title)
                putExtra("body", body)
            }
            val snoozePending = PendingIntent.getBroadcast(
                context,
                notifId * 10 + 2,
                snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            val builder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(soundUri)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
                .setAutoCancel(true)
                .addAction(android.R.drawable.checkbox_on_background, "Mark Taken", takenPending)
                .addAction(android.R.drawable.ic_popup_sync, "Snooze 10m", snoozePending)

            if (openPending != null) {
                builder.setContentIntent(openPending)
            }

            notificationManager.notify(notifId, builder.build())
        }
    }

    companion object {
        const val PREFS_VAULT = "curewell_alarms_vault"
        const val PREFS_COMPANION = "curewell_companion_prefs"
        const val ACTION_DOSE_ALARM = "com.curewell.health.ACTION_DOSE_ALARM"
        const val ACTION_MARK_TAKEN = "com.curewell.health.ACTION_MARK_TAKEN"
        const val ACTION_SNOOZE_DOSE = "com.curewell.health.ACTION_SNOOZE_DOSE"
        const val ACTION_WIDGET_REFRESH = "com.curewell.health.ACTION_WIDGET_REFRESH"

        fun scheduleAlarm(
            context: Context,
            alarmId: Int,
            triggerAtMillis: Long,
            title: String,
            body: String
        ) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, CurewellAlarmReceiver::class.java).apply {
                action = ACTION_DOSE_ALARM
                putExtra("title", title)
                putExtra("body", body)
                putExtra("notif_id", alarmId)
                putExtra("dose_id", alarmId.toString())
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                    } else {
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                }
            } catch (e: SecurityException) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
                }
            }

            // Save alarm to vault for boot recovery
            val vault = context.getSharedPreferences(PREFS_VAULT, Context.MODE_PRIVATE)
            val alarmObj = JSONObject().apply {
                put("id", alarmId)
                put("triggerAtMillis", triggerAtMillis)
                put("title", title)
                put("body", body)
            }
            vault.edit().putString("alarm_\$alarmId", alarmObj.toString()).apply()
        }

        fun cancelAlarm(context: Context, alarmId: Int) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val intent = Intent(context, CurewellAlarmReceiver::class.java).apply {
                    action = ACTION_DOSE_ALARM
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    alarmId,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                }
                removeSavedAlarm(context, alarmId)
            } catch (e: Exception) {
                // Ignore
            }
        }

        fun removeSavedAlarm(context: Context, alarmId: Int) {
            try {
                val vault = context.getSharedPreferences(PREFS_VAULT, Context.MODE_PRIVATE)
                vault.edit().remove("alarm_\$alarmId").apply()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }
}
`
      );

      // CurewellBootReceiver.kt
      fs.writeFileSync(
        path.join(javaDir, 'CurewellBootReceiver.kt'),
        `package com.curewell.health

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import org.json.JSONObject

class CurewellBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON") {

            try {
                val vault = context.getSharedPreferences(CurewellAlarmReceiver.PREFS_VAULT, Context.MODE_PRIVATE)
                val allEntries = vault.all
                val now = System.currentTimeMillis()
                val toReschedule = mutableListOf<JSONObject>()
                val toRemove = mutableListOf<String>()

                for ((key, value) in allEntries) {
                    if (key.startsWith("alarm_") && value is String) {
                        try {
                            val obj = JSONObject(value)
                            val triggerAtMillis = obj.getLong("triggerAtMillis")
                            if (triggerAtMillis > now) {
                                toReschedule.add(obj)
                            } else {
                                toRemove.add(key)
                            }
                        } catch (e: Exception) {
                            toRemove.add(key)
                        }
                    }
                }

                if (toRemove.isNotEmpty()) {
                    val editor = vault.edit()
                    for (key in toRemove) {
                        editor.remove(key)
                    }
                    editor.apply()
                }

                for (obj in toReschedule) {
                    val id = obj.getInt("id")
                    val triggerAtMillis = obj.getLong("triggerAtMillis")
                    val title = obj.optString("title", "Time for your Scheduled Medicine")
                    val body = obj.optString("body", "Tap to confirm your dose in Curewell Companion.")
                    CurewellAlarmReceiver.scheduleAlarm(context, id, triggerAtMillis, title, body)
                }
            } catch (e: Exception) {
                Log.e("CurewellBootReceiver", "Failed to reschedule alarms on boot", e)
            }
        }
    }
}
`
      );

      // CurewellNativeModule.kt & CurewellNativePackage.kt
      fs.writeFileSync(
        path.join(javaDir, 'CurewellNativeModule.kt'),
        `package com.curewell.health

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CurewellNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "CurewellNative"

    @ReactMethod
    fun updateHomeWidget(
        profileName: String,
        adherenceSummary: String,
        nextDoseText: String,
        emergencyMeta: String,
        promise: Promise
    ) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("curewell_companion_prefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
                .putString("profile_name", profileName)
                .putString("adherence_summary", adherenceSummary)
                .putString("next_dose_text", nextDoseText)
                .putString("emergency_meta", emergencyMeta)

            val regex = Regex("""^(\\d+)/(\\d+)""")
            val match = regex.find(adherenceSummary)
            if (match != null) {
                val taken = match.groupValues[1].toIntOrNull() ?: 0
                val total = match.groupValues[2].toIntOrNull() ?: 0
                editor.putInt("taken_count", taken)
                editor.putInt("total_count", total)
            }
            editor.apply()

            val intent = Intent(reactApplicationContext, CurewellDoseWidgetProvider::class.java).apply {
                action = "com.curewell.health.ACTION_WIDGET_REFRESH"
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_ERR", e.message)
        }
    }

    @ReactMethod
    fun triggerInstantDoseNotification(title: String, body: String, promise: Promise) {
        try {
            val notifId = (System.currentTimeMillis() % 10000).toInt()
            val intent = Intent(reactApplicationContext, CurewellAlarmReceiver::class.java).apply {
                action = "com.curewell.health.ACTION_DOSE_ALARM"
                putExtra("title", title)
                putExtra("body", body)
                putExtra("notif_id", notifId)
                putExtra("dose_id", notifId.toString())
            }
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("NOTIF_ERR", e.message)
        }
    }

    @ReactMethod
    fun scheduleOfflineAlarm(alarmId: Int, triggerAtMillis: Double, title: String, body: String, promise: Promise) {
        try {
            val triggerLong = triggerAtMillis.toLong()
            CurewellAlarmReceiver.scheduleAlarm(
                reactApplicationContext,
                alarmId,
                triggerLong,
                title,
                body
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_ERR", e.message)
        }
    }

    @ReactMethod
    fun cancelOfflineAlarm(alarmId: Int, promise: Promise) {
        try {
            CurewellAlarmReceiver.cancelAlarm(reactApplicationContext, alarmId)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ALARM_ERR", e.message)
        }
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                promise.resolve(alarmManager.canScheduleExactAlarms())
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getNativeActionTakenDoses(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("curewell_companion_prefs", Context.MODE_PRIVATE)
            val set = prefs.getStringSet("unconfirmed_taken_doses", null) ?: emptySet()
            val array = Arguments.createArray()
            for (doseId in set) {
                array.pushString(doseId)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("GET_TAKEN_DOSES_ERR", e.message)
        }
    }

    @ReactMethod
    fun clearNativeActionTakenDoses(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("curewell_companion_prefs", Context.MODE_PRIVATE)
            prefs.edit().remove("unconfirmed_taken_doses").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_TAKEN_DOSES_ERR", e.message)
        }
    }
}
`
      );

      fs.writeFileSync(
        path.join(javaDir, 'CurewellNativePackage.kt'),
        `package com.curewell.health

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class CurewellNativePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(CurewellNativeModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
`
      );

      return modConfig;
    },
  ]);

  return config;
}

module.exports = withCurewellAndroidWidget;
