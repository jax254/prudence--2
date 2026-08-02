import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    increment
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const prayerForm = document.getElementById("prayerForm");
const prayerContainer = document.getElementById("prayerContainer");
const prayerTemplate = document.getElementById("prayerTemplate");

let currentUser = null;

// Check Login
onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;

});

// Submit Prayer

prayerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const title = document.getElementById("title").value;

    const request = document.getElementById("request").value;

    const bibleVerse = document.getElementById("bibleVerse").value;

    const anonymous = document.getElementById("anonymous").checked;

    try {

        await addDoc(collection(db, "prayers"), {

            title,

            request,

            bibleVerse,

            anonymous,

            author: anonymous ? "Anonymous" : currentUser.email,

            prayed: 0,

            createdAt: serverTimestamp()

        });

        alert("Prayer request submitted successfully.");

        prayerForm.reset();

    }

    catch (error) {

        alert(error.message);

    }

});

// Load Prayer Requests

const prayerQuery = query(

    collection(db, "prayers"),

    orderBy("createdAt", "desc")

);

onSnapshot(prayerQuery, (snapshot) => {

    prayerContainer.innerHTML = "";

    if (snapshot.empty) {

        prayerContainer.innerHTML =
        "<p>No prayer requests yet.</p>";

        return;

    }

    snapshot.forEach((item) => {

        const prayer = item.data();

        const card =
        prayerTemplate.content.cloneNode(true);

        card.querySelector(".prayerTitle").textContent =
        prayer.title;

        card.querySelector(".prayerAuthor").textContent =
        prayer.author;

        card.querySelector(".prayerText").textContent =
        prayer.request;

        card.querySelector(".prayerVerse").textContent =
        prayer.bibleVerse || "";

        const prayButton =
        card.querySelector(".prayButton");

        prayButton.textContent =
        "🙏 I Prayed (" + (prayer.prayed || 0) + ")";

        prayButton.addEventListener("click", async () => {

            await updateDoc(

                doc(db, "prayers", item.id),

                {

                    prayed: increment(1)

                }

            );

        });

        card.querySelector(".commentButton")
        .addEventListener("click", () => {

            alert("Prayer comments will be added soon.");

        });

        card.querySelector(".shareButton")
        .addEventListener("click", async () => {

            if (navigator.share) {

                await navigator.share({

                    title: prayer.title,

                    text: prayer.request,

                    url: location.href

                });

            } else {

                alert("Sharing is not supported on this device.");

            }

        });

        prayerContainer.appendChild(card);

    });

});
