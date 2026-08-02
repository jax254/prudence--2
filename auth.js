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

        try {

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                username: username,
                admissionNumber: admission,
                email: email,
                role: "user",
                createdAt: serverTimestamp()
            });

            await sendEmailVerification(user);

            alert(
                "Account created successfully!\n\nPlease verify your email before logging in."
            );

            window.location.href = "login.html";

        } catch (error) {
            alert(error.message);
        }

    });

}

if (googleBtn) {

    googleBtn.addEventListener("click", async () => {

        try {

            const provider = new GoogleAuthProvider();

            const result = await signInWithPopup(auth, provider);

            const user = result.user;

            await setDoc(
                doc(db, "users", user.uid),
                {
                    username: user.displayName || "",
                    admissionNumber: "",
                    email: user.email,
                    role: "user",
                    createdAt: serverTimestamp()
                },
                { merge: true }
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            alert(error.message);
        }

    });

}
