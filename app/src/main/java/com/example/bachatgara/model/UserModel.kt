package com.example.bachatgara.model

data class UserModel (
    val id : String = "",
    val name: String = "",
    val lastname: String="",
    val email: String = "",
    val password: String = "",
)
{
    fun toMap() : Map<String, Any?>{
        return mapOf(
            "id" to id,
            "name" to name,
            "lastname" to lastname,
            "email" to email,
            "password" to password,
        )
    }
}