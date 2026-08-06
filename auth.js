import supabase from "./supabase.js";

const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");

if (signupBtn) {

    signupBtn.addEventListener("click", async () => {

        const username = document.getElementById("username").value.trim();
        const admission = document.getElementById("admission").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!username || !admission || !email || !password || !confirmPassword) {
            alert("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    admissionNumber: admission,
                    role: "user"
                }
            }
        });

        if (error) {
            alert(error.message);
            return;
        }

        alert("Account created successfully! Please verify your email before logging in.");

        window.location.href = "login.html";

    });

}

if (googleBtn) {

    googleBtn.addEventListener("click", async () => {

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google"
        });

        if (error) {
            alert(error.message);
        }

    });

}            
