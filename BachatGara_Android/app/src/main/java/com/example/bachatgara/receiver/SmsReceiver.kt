package com.example.bachatgara.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.example.bachatgara.network.ApiClient
import com.example.bachatgara.network.SyncAlertRequest
import com.example.bachatgara.utils.NotificationHelper
import com.example.bachatgara.utils.OfflineSmsStorage
import com.example.bachatgara.utils.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SmsReceiver : BroadcastReceiver() {
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        val token = TokenManager.getToken(context)

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: continue
            val body = sms.messageBody ?: continue
            val timestampMillis = sms.timestampMillis
            val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(timestampMillis))

            if (!isBankSms(sender, body)) {
                Log.d("SmsReceiver", "Ignored non-bank SMS locally from $sender")
                continue
            }

            if (token == null) {
                Log.w("SmsReceiver", "Bank SMS detected from $sender, but user is not logged in.")
                NotificationHelper.showNotification(
                    context,
                    "BachatGara: Not Logged In",
                    "Bank SMS detected from $sender, but app is not logged in. Please log in to enable automatic tracking."
                )
                continue
            }

            Log.d("SmsReceiver", "Bank SMS detected from $sender: $body")

            val notifId = (System.currentTimeMillis() % 10000).toInt()

            scope.launch {
                try {
                    val request = SyncAlertRequest(sender, body, timestamp)
                    val response = ApiClient.get(context).syncAlert("Bearer $token", request)
                    if (response.isSuccessful) {
                        Log.d("SmsReceiver", "Successfully synced bank alert to backend")
                        val bodyObj = response.body()
                        val msg = bodyObj?.message ?: "Alert synced to backend successfully."
                        NotificationHelper.showNotification(
                            context,
                            "SMS Parsed & Synced",
                            "SMS from $sender: $msg",
                            notifId
                        )
                    } else if (response.code() >= 500) {
                        Log.w("SmsReceiver", "Server error (${response.code()}). Saving SMS to offline queue.")
                        OfflineSmsStorage.savePendingSms(context, sender, body, timestampMillis)
                        NotificationHelper.showNotification(
                            context,
                            "SMS Stored Offline",
                            "Server unreachable (${response.code()}). Saved locally; will auto-sync when connected.",
                            notifId
                        )
                    } else {
                        val errCode = response.code()
                        val rawErr = response.errorBody()?.string() ?: ""
                        val cleanErr = try {
                            org.json.JSONObject(rawErr).optString("error", rawErr)
                        } catch (e: Exception) {
                            rawErr.ifBlank { "Server returned status code $errCode" }
                        }
                        Log.e("SmsReceiver", "Failed to sync bank alert ($errCode): $cleanErr")
                        NotificationHelper.showNotification(
                            context,
                            "SMS Sync Error ($errCode)",
                            cleanErr,
                            notifId
                        )
                    }
                } catch (e: Exception) {
                    Log.e("SmsReceiver", "Network offline/error syncing alert. Saving to offline queue.", e)
                    OfflineSmsStorage.savePendingSms(context, sender, body, timestampMillis)
                    NotificationHelper.showNotification(
                        context,
                        "SMS Stored Offline",
                        "Offline / Poor Connection. SMS saved locally; will auto-sync when online.",
                        notifId
                    )
                }
            }
        }
    }

    fun isBankSms(sender: String, body: String): Boolean {
        val cleanSender = sender.trim().uppercase()
        val cleanBody = body.trim()

        val isOtpOrSecurity = cleanBody.contains(Regex("(verification code|OTP|reset password|security code)", RegexOption.IGNORE_CASE))
        if (isOtpOrSecurity) return false

        val isKnownBankSender = cleanSender.contains(Regex("(ADBL|CZBIL|EBL|GBIME|GLOBAL|HBL|KBL|KUMARI|LSB|LSBL|LAXMI|MBL|NABIL|NBL|NIMB|NSBL|NICA|NICASIA|NMB|PRVU|PRABHU|PCBL|PRIME|RBBL|RBB|SANIMA|SBL|SCB)")) ||
                cleanSender.matches(Regex("^(34488|32222|37447|32425|37788|33232|2022|32022|34001|34400|31003|32244|35001|5712|36001|34343|35555|3[0-9]{4}|5[0-9]{3})$"))

        val hasFinancialKeywords = cleanBody.contains(Regex("(debited|credited|transferred|withdrawn|deposited|transfer|wallet load|load|paid|payment)", RegexOption.IGNORE_CASE)) &&
                cleanBody.contains(Regex("(A/C|Account|NPR|Rs|NRs|eSewa|Khalti)", RegexOption.IGNORE_CASE))

        return isKnownBankSender || hasFinancialKeywords
    }
}
