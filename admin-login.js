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

const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");

// IMPORTANT:
// Change this passcode later and do NOT keep it in client-side code
// in a production website.
const ADMIN_PASSCODE = "PRUDENCE2026";

loginBtn.addEventListener("click", async () => {

    const passcode = document.getElementById("passcode").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (passcode !== ADMIN_PASSCODE) {
        alert("Invalid admin passcode.");
        return;
    }

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const uid = userCredential.user.uid;

        const userRef = doc(db, "users", uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("Account not found.");

            await auth.signOut();

            return;

        }

        const data = userSnap.data();

        if (
            data.role === "admin" ||
            data.role === "newsroom" ||
            data.role === "superadmin"
        ) {

            window.location.href = "dashboard.html";

        } else {

            alert("You are not an administrator.");

            await auth.signOut();

        }

    } catch (error) {

        alert(error.message);

    }

});

googleBtn.addEventListener("click", async () => {

    const passcode = document.getElementById("passcode").value.trim();

    if (passcode !== ADMIN_PASSCODE) {

        alert("Invalid admin passcode.");

        return;

    }

    try {

        const provider = new GoogleAuthProvider();

        const result = await signInWithPopup(auth, provider);

        const uid = result.user.uid;

        const userRef = doc(db, "users", uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("You are not registered as an administrator.");

            await auth.signOut();

            return;

        }

        const data = userSnap.data();

        if (
            data.role === "admin" ||
            data.role === "newsroom" ||
            data.role === "superadmin"
        ) {

            window.location.href = "dashboard.html";

        } else {

            alert("Access denied.");

            await auth.signOut();

        }

    } catch (error) {

        alert(error.message);

    }

});
