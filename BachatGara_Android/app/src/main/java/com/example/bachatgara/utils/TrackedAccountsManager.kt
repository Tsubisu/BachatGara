package com.example.bachatgara.utils

import android.content.Context
import android.content.SharedPreferences

object TrackedAccountsManager {
    private const val PREFS_NAME = "bachatgara_accounts_prefs"
    private const val KEY_TRACKED_BANKS = "tracked_banks_list"
    private const val KEY_ACTIVE_SHORTCODES = "active_sender_shortcodes"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveTrackedBanks(context: Context, bankNames: List<String>) {
        val serializedList = bankNames.joinToString(separator = ",")
        val existing = getPrefs(context).getString(KEY_TRACKED_BANKS, "") ?: ""
        if (existing != serializedList) {
            getPrefs(context).edit().putString(KEY_TRACKED_BANKS, serializedList).apply()
        }
    }

    fun getTrackedBanks(context: Context): List<String> {
        val serializedList = getPrefs(context).getString(KEY_TRACKED_BANKS, "") ?: ""
        if (serializedList.isBlank()) return emptyList()
        return serializedList.split(",").map { it.trim() }.filter { it.isNotBlank() }
    }

    fun saveActiveSenderShortcodes(context: Context, shortcodes: List<String>) {
        val serialized = shortcodes.joinToString(separator = ",")
        val existing = getPrefs(context).getString(KEY_ACTIVE_SHORTCODES, "") ?: ""
        if (existing != serialized) {
            getPrefs(context).edit().putString(KEY_ACTIVE_SHORTCODES, serialized).apply()
        }
    }

    fun getActiveSenderShortcodes(context: Context): List<String> {
        val serialized = getPrefs(context).getString(KEY_ACTIVE_SHORTCODES, "") ?: ""
        if (serialized.isBlank()) return emptyList()
        return serialized.split(",").map { it.trim() }.filter { it.isNotBlank() }
    }

    fun clearAll(context: Context) {
        getPrefs(context).edit().clear().apply()
    }
}