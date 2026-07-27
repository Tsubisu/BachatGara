package com.example.bachatgara.utils

import android.content.Context
import android.util.Log

object AccountsObserver {
    private const val TAG = "AccountsObserver"

    fun interface Listener {
        fun onAccountsUpdated(bankNames: List<String>)
    }

    private val listeners = mutableListOf<Listener>()

    fun subscribe(listener: Listener) {
        synchronized(listeners) {
            if (!listeners.contains(listener)) {
                listeners.add(listener)
            }
        }
    }

    fun unsubscribe(listener: Listener) {
        synchronized(listeners) {
            listeners.remove(listener)
        }
    }

    fun notifyAccountsUpdated(
        context: Context,
        bankNames: List<String>,
        senderShortcodes: List<String> = emptyList()
    ) {
        TrackedAccountsManager.saveTrackedBanks(context, bankNames)
        TrackedAccountsManager.saveActiveSenderShortcodes(context, senderShortcodes)

        Log.d(TAG, "Active banks: $bankNames")
        Log.d(TAG, "Active sender shortcodes: $senderShortcodes")

        val activeListeners = synchronized(listeners) { listeners.toList() }
        for (listener in activeListeners) {
            try {
                listener.onAccountsUpdated(bankNames)
            } catch (e: Exception) {
                Log.e(TAG, "Error notifying observer: ${e.localizedMessage}")
            }
        }
    }
}