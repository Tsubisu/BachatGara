package com.example.bachatgara

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.example.bachatgara.network.ApiClient
import com.example.bachatgara.network.LoginRequest
import com.example.bachatgara.ui.theme.BachatGaraTheme
import com.example.bachatgara.utils.ServerManager
import com.example.bachatgara.utils.TokenManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions.entries.all { it.value }
        if (granted) {
            Toast.makeText(this, "Permissions Granted. Tracker Active.", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "SMS Permissions are required for tracking.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        com.example.bachatgara.utils.NotificationHelper.createNotificationChannel(this)
        setContent {
            BachatGaraTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(
                        onRequestPermissions = { requestSmsPermissions() }
                    )
                }
            }
        }
    }

    private fun requestSmsPermissions() {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missingPermissions = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            requestPermissionLauncher.launch(missingPermissions.toTypedArray())
        } else {
            Toast.makeText(this, "Permissions already granted.", Toast.LENGTH_SHORT).show()
        }
    }
}

@Composable
fun AppNavigation(onRequestPermissions: () -> Unit) {
    val context = LocalContext.current
    var token by remember { mutableStateOf(TokenManager.getToken(context)) }

    LaunchedEffect(token) {
        if (token != null) {
            com.example.bachatgara.service.SmsTrackerService.startService(context)
        }
    }

    if (token == null) {
        LoginScreen(onLoginSuccess = { newToken ->
            TokenManager.saveToken(context, newToken)
            com.example.bachatgara.service.SmsTrackerService.startService(context)
            token = newToken
        })
    } else {
        DashboardScreen(
            token = token!!,
            onRequestPermissions = onRequestPermissions,
            onLogout = {
                com.example.bachatgara.service.SmsTrackerService.stopService(context)
                TokenManager.clearToken(context)
                token = null
            }
        )
    }
}

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var serverUrl by remember { mutableStateOf(ServerManager.getServerUrl(context)) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "BachatGara Sync", style = MaterialTheme.typography.headlineLarge)
        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it },
            label = { Text("Server Host / IP (e.g. 192.168.18.14:5000)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(12.dp))
        
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(20.dp))

        if (errorMsg != null) {
            Text(text = errorMsg!!, color = MaterialTheme.colorScheme.error)
            Spacer(modifier = Modifier.height(12.dp))
        }

        Button(
            onClick = {
                if (email.isBlank() || password.isBlank() || serverUrl.isBlank()) {
                    errorMsg = "Fields cannot be empty"
                    return@Button
                }
                ServerManager.saveServerUrl(context, serverUrl)
                isLoading = true
                errorMsg = null
                scope.launch {
                    try {
                        val api = ApiClient.get(context)
                        val response = api.login(LoginRequest(email, password))
                        if (response.isSuccessful && response.body() != null) {
                            onLoginSuccess(response.body()!!.token)
                        } else {
                            errorMsg = "Login failed. Check credentials or server IP."
                        }
                    } catch (e: Exception) {
                        errorMsg = "Network error: ${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
        ) {
            if (isLoading) CircularProgressIndicator(modifier = Modifier.size(24.dp))
            else Text("Login to Connect")
        }
    }
}

@Composable
fun DashboardScreen(token: String, onRequestPermissions: () -> Unit, onLogout: () -> Unit) {
    val context = LocalContext.current
    val currentServerUrl = ServerManager.getServerUrl(context)
    var heartbeatStatus by remember { mutableStateOf("Connecting to heartbeat...") }
    var isConnected by remember { mutableStateOf(true) }

    // Heartbeat check for UI status display & ensure service is running
    LaunchedEffect(token) {
        com.example.bachatgara.service.SmsTrackerService.startService(context)
        while (true) {
            try {
                val response = ApiClient.get(context).heartbeat("Bearer $token")
                if (response.isSuccessful) {
                    heartbeatStatus = "Live Foreground Heartbeat Active"
                    isConnected = true
                } else {
                    heartbeatStatus = "Heartbeat Error (${response.code()})"
                    isConnected = false
                }
            } catch (e: Exception) {
                heartbeatStatus = "Heartbeat Offline: ${e.localizedMessage}"
                isConnected = false
            }
            delay(15_000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Tracker Dashboard", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(24.dp))
        
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = if (isConnected) "Status: Connected & Service Active" else "Status: Disconnected",
                    color = if (isConnected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Server: $currentServerUrl",
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = heartbeatStatus,
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Persistent Foreground Service is active. SMS tracking will continue when app is closed.",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onRequestPermissions,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Verify SMS & Notification Permissions")
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Logout & Stop Background Tracker")
        }
    }
}
