package com.example.bachatgara.repo

import com.example.bachatgara.model.UserModel

interface UserRepo {
    fun login(email: String, password: String, callback: (Boolean, String) -> Unit)

    fun forgetPassword(email: String, callback: (Boolean, String) -> Unit)


    fun getUserById(id: String, callback: (Boolean, String, UserModel?) -> Unit)

    fun getAllUser(callback: (Boolean, String, List<UserModel?>) -> Unit)

    //authentication function
    fun register(email: String, password: String, callback: (Boolean, String, String) -> Unit)

    //database function
    fun addUser(id: String, userModel: UserModel, callback: (Boolean, String) -> Unit)

    fun editProfile(id: String, userModel: UserModel, callback: (Boolean, String) -> Unit)

    fun delteUser(id: String, callback: (Boolean, String) -> Unit)

    fun logout(callback: (Boolean, String) -> Unit)
}