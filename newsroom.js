import { auth, db, storage } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const form = document.getElementById("newsForm");
const myArticles = document.getElementById("myArticles");
const template = document.getElementById("articleTemplate");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "../login.html";
        return;

    }

    currentUser = user;

    const profile = await getDoc(doc(db, "users", user.uid));

    if (!profile.exists()) {

        location.href = "../dashboard.html";
        return;

    }

    const role = profile.data().role;

    if (
        role !== "newsroom" &&
        role !== "admin" &&
        role !== "superadmin"
    ) {

        alert("Access denied.");

        location.href = "../dashboard.html";

        return;

    }

    loadArticles();

});

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const title = document.getElementById("title").value;

    const content = document.getElementById("content").value;

    const image = document.getElementById("image").value;

    const video = document.getElementById("video").value;

    try {

        await addDoc(collection(db, "news"), {

            title,

            content,

            image,

            video,

            author: currentUser.email,

            uid: currentUser.uid,

            approved: false,

            status: "Pending Approval",

            likes: 0,

            createdAt: serverTimestamp()

        });

        alert("News submitted successfully.");

        form.reset();

    }

    catch (error) {

        alert(error.message);

    }

});

function loadArticles() {

    const q = query(

        collection(db, "news"),

        where("uid", "==", currentUser.uid),

        orderBy("createdAt", "desc")

    );

    onSnapshot(q, (snapshot) => {

        myArticles.innerHTML = "";

        if (snapshot.empty) {

            myArticles.innerHTML =
            "<p>No submitted articles.</p>";

            return;

        }

        snapshot.forEach((item) => {

            const news = item.data();

            const card =
            template.content.cloneNode(true);

            card.querySelector(".articleTitle").textContent =
            news.title;

            card.querySelector(".articleStatus").textContent =
            news.status;

            card.querySelector(".articleDate").textContent =
            news.createdAt
            ?
            news.createdAt.toDate().toLocaleString()
            :
            "Just now";

            card.querySelector(".editButton")
            .addEventListener("click", () => {

                alert(
                "Editing will be enabled in the next version."
                );

            });

            myArticles.appendChild(card);

        });

    });

}
