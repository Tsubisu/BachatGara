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
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.bachatgara.ui.theme.bg
import com.example.bachatgara.ui.theme.signin

class Registration : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RegistrationBody()
        }
    }
}

@Composable
fun RegistrationBody() {
    var email by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var visibility by remember { mutableStateOf(false) }

    val context = LocalContext.current
    val activity = context as Activity

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(color = bg),
    ) {
        Spacer(modifier = Modifier.height(75.dp))

        Row(modifier = Modifier.fillMaxWidth().padding(10.dp),
            horizontalArrangement = Arrangement.Center) {
            Image(
                painter = painterResource(R.drawable.logo),
                contentDescription = "Logo",
                modifier = Modifier
                    .size(50.dp),
                Alignment.Center
            )
        }

        Text("Register", style = TextStyle(
            color = signin,
            fontWeight = FontWeight.W700,
            fontSize = 24.sp,
            textAlign = TextAlign.Center
        ),
            modifier = Modifier.fillMaxWidth()
        )

        Row(modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalArrangement = Arrangement.Center) {
            Text(text = "Your journey to achieving more starts right here.", style = TextStyle(
                color = Color.White,
                textAlign = TextAlign.Center
            ))
        }

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(10.dp),
            placeholder = {
                Text("abc@gmail.com")
            },
            colors = TextFieldDefaults.colors(
                unfocusedIndicatorColor = Color.Transparent,
                unfocusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedIndicatorColor = Color.Blue,
            )
        )

        OutlinedTextField(
            value = name,
            onValueChange = {
                name = it
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(10.dp),
            placeholder = {
                Text("Full name")
            },
            colors = TextFieldDefaults.colors(
                unfocusedIndicatorColor = Color.Transparent,
                unfocusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedIndicatorColor = Color.Blue,
            )
        )

        OutlinedTextField(
            value = password,
            onValueChange = {
                password = it
            },
            visualTransformation = if (visibility)
                VisualTransformation.None
            else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = {
                    visibility = !visibility
                }) {
                    Icon(
                        painter =
                            if (visibility)
                                painterResource(R.drawable.baseline_visibility_24)
                            else
                                painterResource(
                                    R.drawable.baseline_visibility_off_24
                                ),
                        contentDescription = null
                    )
                }
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(10.dp),
            placeholder = {
                Text("********")
            },
            colors = TextFieldDefaults.colors(
                unfocusedIndicatorColor = Color.Transparent,
                unfocusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedContainerColor = Color.White.copy(alpha = 0.5f),
                focusedIndicatorColor = Color.Blue,
            )
        )
        Row(modifier = Modifier.padding(10.dp)) {
            Text("Already have an account? ", style = TextStyle(
                color = Color.White
            ))
            Text(
                "Sign In",
                modifier = Modifier.clickable {
                    val intent = Intent(context,
                        Login::class.java)
                    context.startActivity(intent)
                    activity.finish()},
                style = TextStyle(
                    textDecoration = TextDecoration.Underline,
                    color = signin)
            )
        }
        ElevatedButton(modifier = Modifier.padding(10.dp).fillMaxWidth(),
            onClick = {
                val sharedPreferences =
                    context.getSharedPreferences("User", Context.MODE_PRIVATE)
                val editor = sharedPreferences.edit()
                editor.putString("email", email)
                editor.putString("name", name)
                editor.putString("password", password)

                editor.apply()
            },
            colors = ButtonDefaults.elevatedButtonColors(
                containerColor = Color(0, 144, 255),
                contentColor = Color.White
            )
        ) {
            Text(
                "Signup", style = TextStyle(
                    color = Color.White
                )
            )
        }
    }
}


@Preview
@Composable
fun RegistrationPreview(){
    RegistrationBody()
}