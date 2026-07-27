package com.example.bachatgara.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.bachatgara.network.ApiClient
import com.example.bachatgara.network.SseManager
import com.example.bachatgara.network.SyncAlertRequest
import com.example.bachatgara.utils.NotificationHelper
import com.example.bachatgara.utils.OfflineSmsStorage
import com.example.bachatgara.utils.TokenManager
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SmsTrackerService : Service() {

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "SmsTrackerService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP_SERVICE) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        startForegroundServiceNotification()
        SseManager.start(applicationContext, serviceScope)
        startHeartbeatAndQueueSyncLoop()

        return START_STICKY
    }

    private fun startForegroundServiceNotification() {
        createNotificationChannel()

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle("BachatGara Active")
            .setContentText("Listening for incoming bank SMS & background sync active.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private var heartbeatJob: Job? = null

    private fun startHeartbeatAndQueueSyncLoop() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                val token = TokenManager.getToken(applicationContext)
                if (token != null) {
                    try {
                        val response = ApiClient.get(applicationContext).heartbeat("Bearer $token")
                        if (response.isSuccessful) {
                            Log.d(TAG, "Background Heartbeat OK — draining offline SMS queue.")
                            syncOfflineSmsQueue(token)
                        } else {
                            Log.w(TAG, "Background Heartbeat status: ${response.code()}")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Background Heartbeat error: ${e.localizedMessage}")
                    }
                } else {
                    Log.w(TAG, "No auth token found. Stopping background service.")
                    stopSelf()
                    break
                }
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    private suspend fun syncOfflineSmsQueue(token: String) {
        val pendingList = OfflineSmsStorage.getPendingSmsList(applicationContext)
        if (pendingList.isEmpty()) return

        Log.d(TAG, "Found ${pendingList.size} offline SMS alert(s) queued for sync.")

        for (pending in pendingList) {
            try {
                val timestampStr = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(pending.timestamp))
                val request = SyncAlertRequest(pending.sender, pending.body, timestampStr)
                val response = ApiClient.get(applicationContext).syncAlert("Bearer $token", request)

                if (response.isSuccessful) {
                    Log.d(TAG, "Successfully synced offline alert ID ${pending.id}")
                    OfflineSmsStorage.removePendingSms(applicationContext, pending.id)
                    NotificationHelper.showNotification(
                        applicationContext,
                        "Offline SMS Synced",
                        "Queued bank SMS from ${pending.sender} successfully uploaded to backend."
                    )
                } else {
                    Log.w(TAG, "Offline alert ID ${pending.id} failed with status ${response.code()}. Keeping in queue.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error syncing offline alert ID ${pending.id}: ${e.localizedMessage}. Keeping in queue.")
                break
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Background Tracker Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps BachatGara background SMS tracking and heartbeat alive."
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        SseManager.stop()
        serviceJob.cancel()
        Log.d(TAG, "SmsTrackerService destroyed")
    }

    companion object {
        private const val TAG = "SmsTrackerService"
        private const val CHANNEL_ID = "bachatgara_bg_tracker_channel"
        private const val NOTIFICATION_ID = 9001
        private const val HEARTBEAT_INTERVAL_MS = 30_000L
        const val ACTION_STOP_SERVICE = "com.example.bachatgara.STOP_SERVICE"

        fun startService(context: Context) {
            val intent = Intent(context, SmsTrackerService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, SmsTrackerService::class.java).apply {
                action = ACTION_STOP_SERVICE
            }
            context.startService(intent)
        }
    }
}
