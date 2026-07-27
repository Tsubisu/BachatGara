package com.example.bachatgara.network

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.example.bachatgara.utils.AccountsObserver
import com.example.bachatgara.utils.TokenManager
import com.example.bachatgara.utils.TrackedAccountsManager
import kotlinx.coroutines.*
import okhttp3.Call
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object SseManager {
    private const val TAG = "SseManager"
    private const val MAX_BACKOFF_MS = 60_000L

    private var sseJob: Job? = null
    @Volatile
    private var activeCall: Call? = null

    private val mainHandler = Handler(Looper.getMainLooper())

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .build()

    @Synchronized
    fun start(context: Context, scope: CoroutineScope) {
        if (sseJob?.isActive == true && activeCall?.isCanceled() == false) {
            Log.d(TAG, "SSE observer already running. Skipping redundant start.")
            return
        }
        stop()
        sseJob = scope.launch(Dispatchers.IO) {
            var backoffMs = 1_000L
            while (isActive) {
                val token = TokenManager.getToken(context)
                if (token == null) {
                    Log.w(TAG, "No auth token — SSE observer paused.")
                    delay(5_000L)
                    continue
                }

                val serverUrl = com.example.bachatgara.utils.ServerManager.getServerUrl(context)
                val url = "$serverUrl/api/events/stream"
                Log.d(TAG, "Connecting SSE observer → $url")

                val connected = runSseConnection(context, url, token)

                if (!isActive) break

                if (connected) {
                    backoffMs = 1_000L
                } else {
                    Log.w(TAG, "SSE connection ended/failed. Retrying in ${backoffMs}ms…")
                    delay(backoffMs)
                    backoffMs = minOf(backoffMs * 2, MAX_BACKOFF_MS)
                }
            }
        }
    }

    @Synchronized
    fun stop() {
        try {
            activeCall?.cancel()
        } catch (e: Exception) {
        }
        activeCall = null
        sseJob?.cancel()
        sseJob = null
        Log.d(TAG, "SSE observer stopped and network calls cancelled.")
    }

    private fun runSseConnection(context: Context, url: String, token: String): Boolean {
        val request = Request.Builder()
            .url(url)
            .header("Authorization", "Bearer $token")
            .header("Accept", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .build()

        val call = httpClient.newCall(request)
        activeCall = call

        return try {
            val response = call.execute()
            if (!response.isSuccessful) {
                Log.w(TAG, "SSE HTTP error status ${response.code()}")
                response.close()
                activeCall = null
                return false
            }

            Log.d(TAG, "SSE stream connected ✓")
            val body = response.body()
            val source = body?.source()

            if (source == null) {
                response.close()
                activeCall = null
                return false
            }

            val dataBuffer = StringBuilder()
            while (!call.isCanceled()) {
                val line = source.readUtf8Line() ?: break
                val trimmed = line.trim()
                when {
                    trimmed.startsWith(":") -> {
                        // SSE keep-alive comment — ignore
                    }
                    trimmed.startsWith("data:") -> {
                        dataBuffer.append(trimmed.substring(5).trim())
                    }
                    trimmed.isEmpty() -> {
                        if (dataBuffer.isNotEmpty()) {
                            processEvent(context, dataBuffer.toString())
                            dataBuffer.setLength(0)
                        }
                    }
                }
            }

            response.close()
            activeCall = null
            Log.d(TAG, "SSE stream closed cleanly.")
            true
        } catch (e: Exception) {
            activeCall = null
            if (call.isCanceled()) {
                Log.d(TAG, "SSE connection cancelled intentionally.")
            } else {
                Log.e(TAG, "SSE connection error: ${e.localizedMessage}")
            }
            false
        }
    }

    private fun processEvent(context: Context, json: String) {
        try {
            val obj = JSONObject(json)
            val type = obj.optString("type")

            if (type == "account") {
                val shortcodesArray = obj.optJSONArray("activeSenderShortcodes")
                if (shortcodesArray != null) {
                    val shortcodes = (0 until shortcodesArray.length())
                        .map { shortcodesArray.getString(it) }

                    TrackedAccountsManager.saveActiveSenderShortcodes(context, shortcodes)

                    val action = obj.optString("action", "updated")
                    Log.d(TAG, "Account '$action' — active shortcodes updated: $shortcodes")

                    val bankNames = TrackedAccountsManager.getTrackedBanks(context)

                    mainHandler.post {
                        AccountsObserver.notifyAccountsUpdated(context, bankNames, shortcodes)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse SSE event: $json", e)
        }
    }
}
