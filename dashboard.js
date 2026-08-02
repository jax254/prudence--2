import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const username = document.getElementById("username");
const admissionNumber = document.getElementById("admissionNumber");
const comment = document.getElementById("comment");
const postComment = document.getElementById("postComment");
const commentsContainer = document.getElementById("commentsContainer");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {

        alert("User profile not found.");
        return;

    }

    const data = userSnap.data();

    username.textContent = data.username || "User";
    admissionNumber.textContent = data.admissionNumber || "Not Provided";

    if (data.suspended === true) {

        postComment.disabled = true;
        comment.disabled = true;

        alert("Your account has been suspended.");

    }

});

postComment.addEventListener("click", async () => {

    if (!currentUser) return;

    if (comment.value.trim() === "") {

        alert("Please write a comment.");

        return;

    }

    await addDoc(collection(db, "comments"), {

        uid: currentUser.uid,

        message: comment.value,

        createdAt: serverTimestamp()

    });

    comment.value = "";

});

const commentsQuery = query(

    collection(db, "comments"),

    orderBy("createdAt", "desc")

);

onSnapshot(commentsQuery, async (snapshot) => {

    commentsContainer.innerHTML = "";

    snapshot.forEach(async (docSnap) => {

        const data = docSnap.data();

        let name = "Anonymous";

        try {

            const profile = await getDoc(doc(db, "users", data.uid));

            if (profile.exists()) {

                name = profile.data().username;

            }

        } catch (e) {}

        commentsContainer.innerHTML += `

        <div class="comment">

            <strong>${name}</strong>

            <p>${data.message}</p>

        </div>

        `;

    });

});
