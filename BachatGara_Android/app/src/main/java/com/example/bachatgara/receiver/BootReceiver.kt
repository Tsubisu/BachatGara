package com.example.bachatgara.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.bachatgara.service.SmsTrackerService
import com.example.bachatgara.utils.TokenManager

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.d("BootReceiver", "Device reboot completed. Checking BachatGara token status...")
            val token = TokenManager.getToken(context)
            if (token != null) {
                Log.d("BootReceiver", "User is logged in. Auto-starting SmsTrackerService background tracker...")
                SmsTrackerService.startService(context)
            } else {
                Log.d("BootReceiver", "User is not logged in. Skipping background tracker auto-start.")
            }
        }
    }
}
