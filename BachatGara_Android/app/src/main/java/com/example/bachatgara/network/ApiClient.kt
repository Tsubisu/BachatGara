package com.example.bachatgara.network

import android.content.Context
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    @Volatile private var cachedUrl: String = ""
    @Volatile private var cachedService: ApiService? = null

    fun get(context: Context): ApiService {
        val url = com.example.bachatgara.utils.ServerManager.getServerUrl(context)

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

    const val DEFAULT_URL = "http://10.0.2.2:5000"
}
