package com.example.bachatgara.network

import android.content.Context
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    // Cache so we don't rebuild Retrofit on every call
    @Volatile private var cachedUrl: String = ""
    @Volatile private var cachedService: ApiService? = null

    /**
     * Returns an ApiService pointed at the URL saved by the user.
     * Call this with context wherever you need the API service.
     */
    fun get(context: Context): ApiService {
        val url = com.example.bachatgara.utils.ServerManager.getServerUrl(context)
        // Rebuild Retrofit only if the URL changed
        if (url != cachedUrl || cachedService == null) {
            cachedUrl = url
            cachedService = Retrofit.Builder()
                .baseUrl(url)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
        return cachedService!!
    }

    /** The default emulator alias, shown as placeholder in setup screen */
    const val DEFAULT_URL = "http://10.0.2.2:5000"
}
