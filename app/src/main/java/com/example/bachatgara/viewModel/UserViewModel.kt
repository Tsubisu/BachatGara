package com.example.bachatgarar.viewModel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.bachatgara.model.UserModel
import com.example.bachatgara.repo.UserRepo

class UserViewModel(val repo : UserRepo) : ViewModel() {
    fun login(email: String, password: String, callback: (Boolean, String) -> Unit)
    {
        repo.login(email, password, callback)
    }

    fun forgetPassword(email: String, callback: (Boolean, String) -> Unit)
    {
        repo.forgetPassword(email, callback)
    }


    private val _loading = MutableLiveData<Boolean>()
    val loading: MutableLiveData<Boolean> get() = _loading

    private val _users = MutableLiveData<UserModel?>()
    val users: MutableLiveData<UserModel?> get() = _users
    fun getUserById(
        id: String
    ){
        _loading.value = true
        repo.getUserById(id){
            success, msg, data->
            if(success == true){
                _users.value = data
                _loading.value = false
            }else{
                _users.value = null
                _loading.value = false
            }
        }
    }

    private val _allUsers = MutableLiveData<List<UserModel?>>()
    val allUsers: MutableLiveData<List<UserModel?>> get() = _allUsers

    fun getAllUser()
    {
        _loading.value = true
        repo.getAllUser { success, message, data ->
            if (success){
                _loading.value = false
                _allUsers.value = data
            }else{
                _loading.value = false
                _allUsers.value = emptyList()
            }
        }
    }

    //authentication function
    fun register(email: String, password: String, callback: (Boolean, String, String) -> Unit)
    {
        repo.register(email, password, callback)
    }

    //database function
    fun addUser(id: String, userModel: UserModel, callback: (Boolean, String) -> Unit)
    {
        repo.addUser(id, userModel, callback)
    }

    fun editProfile(id: String, userModel: UserModel, callback: (Boolean, String) -> Unit)
    {
        repo.editProfile(id, userModel, callback)
    }

    fun delteUser(id: String, callback: (Boolean, String) -> Unit)
    {
        repo.delteUser(id, callback)
    }

    fun logout(callback: (Boolean, String) -> Unit)
    {
        repo.logout(callback)
    }
}