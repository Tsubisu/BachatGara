package com.example.bachatgara.utils

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

data class PendingSms(
    val id: String,
    val sender: String,
    val body: String,
    val timestamp: Long
)

object OfflineSmsStorage {
    private const val PREF_NAME = "bachatgara_offline_sms_prefs"
    private const val KEY_PENDING_QUEUE = "pending_sms_queue"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun savePendingSms(context: Context, sender: String, body: String, timestamp: Long) {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_PENDING_QUEUE, "[]") ?: "[]"
        val jsonArray = JSONArray(jsonString)

        val newObj = JSONObject().apply {
            put("id", UUID.randomUUID().toString())
            put("sender", sender)
            put("body", body)
            put("timestamp", timestamp)
        }

        jsonArray.put(newObj)
        prefs.edit().putString(KEY_PENDING_QUEUE, jsonArray.toString()).apply()
    }

    @Synchronized
    fun getPendingSmsList(context: Context): List<PendingSms> {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_PENDING_QUEUE, "[]") ?: "[]"
        val jsonArray = JSONArray(jsonString)
        val list = mutableListOf<PendingSms>()

        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.getJSONObject(i)
            list.add(
                PendingSms(
                    id = obj.getString("id"),
                    sender = obj.getString("sender"),
                    body = obj.getString("body"),
                    timestamp = obj.getLong("timestamp")
                )
            )
        }

        return list
    }

    @Synchronized
    fun removePendingSms(context: Context, id: String) {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_PENDING_QUEUE, "[]") ?: "[]"
        val jsonArray = JSONArray(jsonString)
        val newArray = JSONArray()

        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.getJSONObject(i)
            if (obj.getString("id") != id) {
                newArray.put(obj)
            }
        }

        prefs.edit().putString(KEY_PENDING_QUEUE, newArray.toString()).apply()
    }
}
