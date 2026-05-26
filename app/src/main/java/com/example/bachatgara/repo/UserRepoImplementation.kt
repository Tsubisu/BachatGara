package com.example.bachatgara.repo
import com.example.bachatgara.model.UserModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

class UserRepoImplementation : UserRepo {
    val auth = FirebaseAuth.getInstance()

    val database = FirebaseDatabase.getInstance()

    val ref = database.getReference("users")

    override fun login(
        email: String,
        password: String,
        callback: (Boolean, String) -> Unit
    ) {
        auth.signInWithEmailAndPassword(email,password)
            .addOnCompleteListener {
                if(it.isSuccessful){
                    callback(true, "Login Successful")
                }else{
                    callback(false,"${it.exception?.message}")
                }
        }
    }

    override fun forgetPassword(
        email: String,
        callback: (Boolean, String) -> Unit
    ) {
        auth.sendPasswordResetEmail(email)
            .addOnCompleteListener {
                if(it.isSuccessful){
                    callback(true, "Reset link sent to $email")
                }else{
                    callback(false,"${it.exception?.message}")
                }
            }
    }

    override fun getUserById(
        id: String,
        callback: (Boolean, String, UserModel?) -> Unit
    ) {
        ref.child(id).addValueEventListener(object : ValueEventListener{
            override fun onDataChange(snapshot: DataSnapshot) {
                if(snapshot.exists()){
                    val user = snapshot.getValue(UserModel::class.java)
                    if(user != null){
                        callback(true, "user fetched", user)
                    }
                    user.let{
                        callback(true, "user fetched", it)
                    }
                }
            }

            override fun onCancelled(error: DatabaseError) {
                callback(false, "${error.message}", null)
            }
        })
    }

    override fun getAllUser(callback: (Boolean, String, List<UserModel?>) -> Unit) {
        ref.addValueEventListener(object  : ValueEventListener{
            override fun onDataChange(snapshot: DataSnapshot) {
                if(snapshot.exists()){
                    val allUsers = mutableListOf<UserModel>()
                    for(user in snapshot.children){
                        val data = user.getValue(UserModel::class.java)
                        if(data != null){
                            allUsers.add(data)
                        }
                    }
                    callback(true,"fetched",allUsers)
                }
            }
            override fun onCancelled(error: DatabaseError) {
                callback(false,error.message,emptyList())
            }
        })
    }

    override fun register(
        email: String,
        password: String,
        callback: (Boolean, String, String) -> Unit
    ) {
        auth.createUserWithEmailAndPassword(email,password)
            .addOnCompleteListener {
                if(it.isSuccessful){
                    callback(true, "Login successful", "${auth.currentUser?.uid}")
                }else{
                    callback(false,"${it.exception?.message}", "")
                }
            }    }
//C RUD
    override fun addUser(
        id: String,
        userModel: UserModel,
        callback: (Boolean, String) -> Unit
    ) {
//to auto generate id
//        val id = ref.push().key.toString()
       ref.child(id).setValue(userModel).addOnCompleteListener {
           if(it.isSuccessful){
               callback(true, "User registered")
           }else{
               callback(false, "${it.exception?.message}")
           }
       }
    }

    override fun editProfile(
        id: String,
        userModel: UserModel,
        callback: (Boolean, String) -> Unit
    ) {
//        val id = ref.push().key.toString()
        ref.child(id).updateChildren(userModel.toMap()).addOnCompleteListener {
            if (it.isSuccessful) {
                callback(true, "Successful")
            } else {
                callback(false, "${it.exception?.message}")
            }
        }
    }

    override fun delteUser(
        id: String,
        callback: (Boolean, String) -> Unit
    ) {
        ref.child(id).removeValue().addOnCompleteListener {
            if(it.isSuccessful){
                callback(true, "User Deleted")
            }else{
                callback(false, "${it.exception?.message}")
            }
        }
    }

    override fun logout(callback: (Boolean, String) -> Unit) {
        try {
            auth.signOut()
            callback(true, "Logout successful")
        }catch (e: Exception){
            callback(false, e.toString())
        }
    }
}