import supabase from "./supabase.js";

const signupForm = document.getElementById("signupForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const usernameInput = document.getElementById("username");
const churchInput = document.getElementById("church");

const googleButton = document.getElementById("googleSignup");


/* =========================
   EMAIL SIGN UP
========================= */

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const church = churchInput
            ? churchInput.value.trim()
            : "";


        /* Check passwords */

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;
        }


        /* Password length */

        if (password.length < 6) {

            alert("Password must be at least 6 characters.");

            return;
        }


        try {

            const { data, error } =
                await supabase.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            username: username,

                            church: church

                        }

                    }

                });


            if (error) {

                alert(error.message);

                return;
            }


            if (!data.user) {

                alert("Account could not be created.");

                return;
            }


            alert(
                "Account created successfully!\n\n" +
                "Please check your email and verify your account before logging in."
            );


            window.location.href = "login.html";


        } catch (error) {

            alert(error.message);

        }

    });

}


/* =========================
   GOOGLE SIGN UP
========================= */

if (googleButton) {

    googleButton.addEventListener("click", async () => {

        try {

            const { error } =
                await supabase.auth.signInWithOAuth({

                    provider: "google",

                    options: {

                        redirectTo:
                            window.location.origin +
                            "/dashboard.html"

                    }

                });


            if (error) {

                alert(error.message);

            }

        } catch (error) {

            alert(error.message);

        }

    });

                    }
        
