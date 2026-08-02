import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// Form elements

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const googleLogin = document.getElementById("googleLogin");


// Redirect according to role

async function redirectUser(user){

    const userRef = doc(db,"users",user.uid);

    const userSnap = await getDoc(userRef);


    if(!userSnap.exists()){

        window.location.href="dashboard.html";

        return;

    }


    const data = userSnap.data();


    if(data.role === "superadmin"){

        window.location.href="superadmin/dashboard.html";

    }

    else if(
        data.role === "admin" ||
        data.role === "newsroom"
    ){

        window.location.href="admin/dashboard.html";

    }

    else{

        window.location.href="dashboard.html";

    }

}



// Email Login

if(loginForm){

loginForm.addEventListener("submit", async(e)=>{

e.preventDefault();


try{


const result =
await signInWithEmailAndPassword(

auth,

emailInput.value,

passwordInput.value

);


const user = result.user;


// Check email verification

if(!user.emailVerified){

alert(
"Please verify your email before logging in."
);

return;

}


await redirectUser(user);


}

catch(error){

alert(error.message);

}


});

}



// Google Login

if(googleLogin){


googleLogin.addEventListener("click", async()=>{


try{


const provider =
new GoogleAuthProvider();


const result =
await signInWithPopup(

auth,

provider

);


await redirectUser(result.user);


}

catch(error){

alert(error.message);

}


});


}
