package com.example.bachatgara.utils

import android.content.Context
import android.content.SharedPreferences
import com.example.bachatgara.network.ApiClient

object ServerManager {
    private const val PREF_NAME = "bachatgara_prefs"
    private const val KEY_SERVER_URL = "server_url"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveServerUrl(context: Context, url: String) {
        var cleanUrl = url.trim()
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://$cleanUrl"
        }
        if (!cleanUrl.substringAfter("://").contains(":")) {
            cleanUrl = "$cleanUrl:5000"
        }
        getPrefs(context).edit().putString(KEY_SERVER_URL, cleanUrl).apply()
    }

    fun getServerUrl(context: Context): String {
        return getPrefs(context).getString(KEY_SERVER_URL, ApiClient.DEFAULT_URL) ?: ApiClient.DEFAULT_URL
    }
}
