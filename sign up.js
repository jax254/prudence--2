import supabase from "./supabase.js";

const signupForm = document.getElementById("signupForm");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const admissionInput = document.getElementById("admissionNumber");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const churchInput = document.getElementById("church");
const countryInput = document.getElementById("country");
const termsInput = document.getElementById("terms");

const googleButton = document.getElementById("googleSignup");


// ==========================================
// EMAIL / PASSWORD SIGNUP
// ==========================================

if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const fullName = fullNameInput.value.trim();
        const username = usernameInput.value.trim();
        const admissionNumber = admissionInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const church = churchInput.value.trim();
        const country = countryInput.value.trim();


        // Check required fields
        if (
            !fullName ||
            !username ||
            !admissionNumber ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            alert("Please fill in all required fields.");
            return;

        }


        // Check passwords
        if (password !== confirmPassword) {

            alert("Passwords do not match.");
            return;

        }


        // Check password length
        if (password.length < 8) {

            alert("Password must be at least 8 characters.");
            return;

        }


        // Check Terms
        if (!termsInput.checked) {

            alert("You must agree to the Terms of Service and Privacy Policy.");
            return;

        }


        try {

            const { data, error } = await supabase.auth.signUp({

                email: email,

                password: password,

                options: {

                    emailRedirectTo:
                        window.location.origin + "/login.html",

                    data: {

                        full_name: fullName,

                        username: username,

                        admission_number: admissionNumber,

                        church: church,

                        country: country,

                        terms_accepted: true

                    }

                }

            });


            if (error) {

                console.error(error);

                alert(error.message);

                return;

            }


            if (!data.user) {

                alert("Something went wrong. Please try again.");

                return;

            }


            alert(
                "Account created successfully!\n\n" +
                "Please check your email and verify your account before logging in."
            );


            window.location.href = "login.html";


        } catch (error) {

            console.error(error);

            alert(
                "An unexpected error occurred. Please try again."
            );

        }

    });

}


// ==========================================
// GOOGLE SIGNUP
// ==========================================

if (googleButton) {

    googleButton.addEventListener("click", async () => {

        try {

            const { error } =
                await supabase.auth.signInWithOAuth({

                    provider: "google",

                    options: {

                        redirectTo:
                            window.location.origin + "/dashboard.html"

                    }

                });


            if (error) {

                console.error(error);

                alert(error.message);

            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to continue with Google. Please try again."
            );

        }

    });

    }
