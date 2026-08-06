import supabase from "./firebase.js";

// Form elements

const signupForm = document.getElementById("signupForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const admissionInput = document.getElementById("admissionNumber");
const googleButton = document.getElementById("googleSignup");

// Email Signup

if (signupForm) {

signupForm.addEventListener("submit", async (e) => {

e.preventDefault();

const { data, error } = await supabase.auth.signUp({

email: emailInput.value,

password: passwordInput.value,

options: {

data: {

username: usernameInput.value,

admissionNumber: admissionInput.value,

role: "user"

}

}

});

if (error) {

alert(error.message);

return;

}

alert("Account created. Please check your email for verification.");

window.location.href = "login.html";

});

}

// Google Signup

if (googleButton) {

googleButton.addEventListener("click", async () => {

const { error } = await supabase.auth.signInWithOAuth({

provider: "google"

});

if (error) {

alert(error.message);

}

});

}
