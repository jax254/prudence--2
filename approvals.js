import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const pendingNews = document.getElementById("pendingNews");
const template = document.getElementById("newsTemplate");

let currentUser = null;

// Check Super Admin
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        alert("Access denied.");
        window.location.href = "../dashboard.html";
        return;
    }

    const userData = userSnap.data();

    if (userData.role !== "superadmin") {
        alert("Only the Super Admin can access this page.");
        window.location.href = "dashboard.html";
        return;
    }

    loadPendingNews();

});

// Load Pending News
function loadPendingNews() {

    const q = query(
        collection(db, "news"),
        where("approved", "==", false)
    );

    onSnapshot(q, (snapshot) => {

        pendingNews.innerHTML = "";

        if (snapshot.empty) {
            pendingNews.innerHTML = "<h3>No pending news.</h3>";
            return;
        }

        snapshot.forEach((item) => {

            const news = item.data();

            const card = template.content.cloneNode(true);

            card.querySelector(".title").textContent = news.title;
            card.querySelector(".author").textContent = "Author: " + news.author;
            card.querySelector(".category").textContent = "Category: " + news.category;
            card.querySelector(".content").textContent = news.content;

            // Image
            if (news.image) {
                const image = card.querySelector(".image");
                image.src = news.image;
                image.style.display = "block";
            }

            // Video
            if (news.video) {
                const video = card.querySelector(".video");
                video.src = news.video;
                video.style.display = "block";
            }

            // Approve
            card.querySelector(".approve").onclick = async () => {

                const feedback =
                    card.querySelector(".feedback").value;

                await updateDoc(doc(db, "news", item.id), {

                    approved: true,

                    status: "Approved",

                    feedback: feedback,

                    approvedBy: currentUser.email,

                    approvedAt: serverTimestamp()

                });

                alert("News Approved Successfully.");

            };

            // Reject
            card.querySelector(".reject").onclick = async () => {

                const feedback =
                    card.querySelector(".feedback").value;

                await updateDoc(doc(db, "news", item.id), {

                    approved: false,

                    status: "Rejected",

                    feedback: feedback,

                    approvedBy: currentUser.email,

                    approvedAt: serverTimestamp()

                });

                alert("News Rejected.");

            };

            pendingNews.appendChild(card);

        });

    });

}
