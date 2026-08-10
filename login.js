import supabase from "./supabase.js";
alert("Prudence login JavaScript is working!");
// Form elements

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const googleLogin = document.getElementById("googleLogin");


// Redirect according to role

async function redirectUser(user){

    const role = user.user_metadata?.role || "user";

    if(role === "superadmin"){

        window.location.href = "superadmin/dashboard.html";

    }

    else if(role === "admin" || role === "newsroom"){

        window.location.href = "admin/dashboard.html";

    }

    else{

        window.location.href = "dashboard.html";

    }

}


// Email Login

if(loginForm){

loginForm.addEventListener("submit", async(e)=>{

e.preventDefault();

const { data, error } = await supabase.auth.signInWithPassword({

email: emailInput.value,

password: passwordInput.value

});

if(error){

alert(error.message);

return;

}

const user = data.user;

if(!user.email_confirmed_at){

alert("Please verify your email before logging in.");

await supabase.auth.signOut();

return;

}

await redirectUser(user);

});

}



// Google Login

if(googleLogin){

googleLogin.addEventListener("click", async()=>{

const { error } = await supabase.auth.signInWithOAuth({

provider: "google"

});

if(error){

alert(error.message);

}

});

                             }


