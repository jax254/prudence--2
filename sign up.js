import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// Form elements

const signupForm = document.getElementById("signupForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const usernameInput = document.getElementById("username");

const admissionInput = document.getElementById("admissionNumber");

const googleButton = document.getElementById("googleSignup");


// Email Signup

if(signupForm){

signupForm.addEventListener("submit", async(e)=>{

e.preventDefault();


try{


const userCredential =
await createUserWithEmailAndPassword(

auth,

emailInput.value,

passwordInput.value

);


const user = userCredential.user;


// Send verification email

await sendEmailVerification(user);


// Save user information

await setDoc(

doc(db,"users",user.uid),

{

username: usernameInput.value,

email:user.email,

admissionNumber: admissionInput.value,

role:"user",

createdAt:serverTimestamp()

}

);


alert(
"Account created. Please check your email for verification."
);


window.location.href="login.html";


}

catch(error){

alert(error.message);

}


});


}



// Google Signup

if(googleButton){


googleButton.addEventListener("click", async()=>{


try{


const provider =
new GoogleAuthProvider();


const result =
await signInWithPopup(

auth,

provider

);


const user=result.user;



await setDoc(

doc(db,"users",user.uid),

{

username:user.displayName,

email:user.email,

role: "user",
photoURL: "",
status: "active",
createdAt: serverTimestamp()

},

{
merge:true
}

);


window.location.href="dashboard.html";


}

catch(error){

alert(error.message);

}


});


}
