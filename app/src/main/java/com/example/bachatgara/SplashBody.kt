package com.example.bachatgara

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.bachatgara.ui.theme.*
import kotlinx.coroutines.delay

class SplashBody : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Splash()
        }
    }
}

@Composable
fun Splash(){
    val context = LocalContext.current
    val activity = context as Activity
    LaunchedEffect(Unit) {

        delay(3000)
        val sharedPreferences = context.getSharedPreferences(
                "User",
                Context.MODE_PRIVATE
        )
        val intent = Intent(context, Login::class.java)
        context.startActivity(intent)
        activity.finish()
    }


    Column(
            modifier = Modifier.fillMaxSize().background(color = bg)
            ,
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Image(
                painter = painterResource(R.drawable.logo),
                contentDescription = null,
                modifier = Modifier
                        .height(60.dp)
                        .width(60.dp)
        )
        Spacer(modifier = Modifier.height(20.dp))
        CircularProgressIndicator()
    }
}

@Preview
@Composable
fun SplashPreview(){
    Splash()
}