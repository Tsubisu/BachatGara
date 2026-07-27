package com.example.bachatgara.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.GET

data class LoginRequest(val email: String, val password: String)
data class LoginResponse(val token: String, val user: UserDto)
data class UserDto(val id: String, val email: String)

data class SyncAlertRequest(
    val sender: String,
    val body: String,
    val timestamp: String
)

data class AccountDto(
    val id: String,
    val name: String,
    val account_mask: String?,
    val is_active: Boolean? = true,
    val type: String? = null,
    val balance: Double? = 0.0,
    val senderShortcodes: List<String>? = emptyList()
)

data class ServerInfoResponse(
    val app: String,
    val local_ip: String,
    val port: Int
)

data class HeartbeatResponse(val message: String)

data class SyncAlertResponse(val message: String?, val alert: Map<String, Any>?)

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("/api/alerts/sync")
    suspend fun syncAlert(
        @Header("Authorization") token: String,
        @Body request: SyncAlertRequest
    ): Response<SyncAlertResponse>

    @GET("/api/accounts")
    suspend fun getAccounts(
        @Header("Authorization") token: String
    ): Response<List<AccountDto>>

    @GET("/api/accounts/active")
    suspend fun getActiveAccounts(
        @Header("Authorization") token: String
    ): Response<List<AccountDto>>

    @POST("/api/gateway/heartbeat")
    suspend fun heartbeat(
        @Header("Authorization") token: String
    ): Response<HeartbeatResponse>

    @GET("/api/server-info")
    suspend fun serverInfo(): Response<ServerInfoResponse>
}
