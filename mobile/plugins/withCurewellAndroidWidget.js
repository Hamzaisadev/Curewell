const { withAndroidManifest, withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for Curewell Native Android Features:
 * 1. Native Android Home-Screen Widget (CurewellDoseWidgetProvider)
 * 2. Exact Offline Medication Alarm Receiver (CurewellAlarmReceiver) with Lock-Screen Actions
 * 3. React Native Bridge Module (CurewellNativeModule & CurewellNativePackage)
 */
function withCurewellAndroidWidget(config) {
  // 1. Add Receiver & Widget Provider entries to AndroidManifest.xml
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const app = manifest.application?.[0];
    if (!app) return modConfig;

    app.receiver = app.receiver || [];

    // Ensure CurewellDoseWidgetProvider is registered
    const hasWidget = app.receiver.some(
      (r) => r.$?.['android:name'] === '.CurewellDoseWidgetProvider'
    );
    if (!hasWidget) {
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
    }

    // Ensure CurewellAlarmReceiver is registered for offline scheduled notifications & boot recovery
    const hasAlarm = app.receiver.some(
      (r) => r.$?.['android:name'] === '.CurewellAlarmReceiver'
    );
    if (!hasAlarm) {
      app.receiver.push({
        $: {
          'android:name': '.CurewellAlarmReceiver',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'com.curewell.health.ACTION_DOSE_ALARM' } },
              { $: { 'android:name': 'com.curewell.health.ACTION_MARK_TAKEN' } },
              { $: { 'android:name': 'com.curewell.health.ACTION_SNOOZE_DOSE' } },
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
            ],
          },
        ],
      });
    }

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
        if (intent.action == "com.curewell.health.ACTION_WIDGET_REFRESH") {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, CurewellDoseWidgetProvider::class.java))
            onUpdate(context, manager, ids)
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

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class CurewellAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "curewell_dose_alarms"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Curewell Medication Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Offline scheduled medication dose alarms and reminders"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        if (action == "com.curewell.health.ACTION_MARK_TAKEN") {
            val notifId = intent.getIntExtra("notif_id", 1001)
            notificationManager.cancel(notifId)
            return
        }

        if (action == "com.curewell.health.ACTION_DOSE_ALARM") {
            val title = intent.getStringExtra("title") ?: "Time for your Scheduled Medicine"
            val body = intent.getStringExtra("body") ?: "Tap to confirm your dose in Curewell Companion."
            val notifId = intent.getIntExtra("notif_id", (System.currentTimeMillis() % 10000).toInt())

            val openIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val openPending = PendingIntent.getActivity(
                context,
                notifId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val takenIntent = Intent(context, CurewellAlarmReceiver::class.java).apply {
                this.action = "com.curewell.health.ACTION_MARK_TAKEN"
                putExtra("notif_id", notifId)
            }
            val takenPending = PendingIntent.getBroadcast(
                context,
                notifId + 1,
                takenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(openPending)
                .addAction(android.R.drawable.checkbox_on_background, "Mark Taken", takenPending)
                .build()

            notificationManager.notify(notifId, notification)
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
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
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
            prefs.edit()
                .putString("profile_name", profileName)
                .putString("adherence_summary", adherenceSummary)
                .putString("next_dose_text", nextDoseText)
                .putString("emergency_meta", emergencyMeta)
                .apply()

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
            val intent = Intent(reactApplicationContext, CurewellAlarmReceiver::class.java).apply {
                action = "com.curewell.health.ACTION_DOSE_ALARM"
                putExtra("title", title)
                putExtra("body", body)
                putExtra("notif_id", (System.currentTimeMillis() % 10000).toInt())
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
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactApplicationContext, CurewellAlarmReceiver::class.java).apply {
                action = "com.curewell.health.ACTION_DOSE_ALARM"
                putExtra("title", title)
                putExtra("body", body)
                putExtra("notif_id", alarmId)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerLong = triggerAtMillis.toLong()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerLong, pendingIntent)
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerLong, pendingIntent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ALARM_ERR", e.message)
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
