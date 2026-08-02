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
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const newsList = document.getElementById("newsList");
const template = document.getElementById("newsTemplate");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "../login.html";
        return;
    }

    currentUser = user;

    const profile = await getDoc(doc(db, "users", user.uid));

    if (!profile.exists()) {
        location.href = "../login.html";
        return;
    }

    if (profile.data().role !== "superadmin") {

        alert("Access denied.");

        location.href = "../dashboard.html";

        return;

    }

    loadPendingNews();

});

function loadPendingNews() {

    const q = query(
        collection(db, "news"),
        where("approved", "==", false)
    );

    onSnapshot(q, (snapshot) => {

        newsList.innerHTML = "";

        if (snapshot.empty) {

            newsList.innerHTML =
            "<h3>No pending news.</h3>";

            return;

        }

        snapshot.forEach((item) => {

            const news = item.data();

            const card =
            template.content.cloneNode(true);

            card.querySelector(".title").textContent =
            news.title;

            card.querySelector(".author").textContent =
            "Author: " + news.author;

            card.querySelector(".content").textContent =
            news.content;

            card.querySelector(".date").textContent =
            news.createdAt
            ?
            news.createdAt.toDate().toLocaleString()
            :
            "Just now";

            const image =
            card.querySelector(".image");

            if(news.image){

                image.src = news.image;

            }else{

                image.style.display = "none";

            }

            // Approve

            card.querySelector(".approveBtn")
            .onclick = async()=>{

                await updateDoc(
                    doc(db,"news",item.id),
                    {
                        approved:true,
                        status:"Published"
                    }
                );

                await logAction(
                    "Approved news: " +
                    news.title
                );

            };

            // Reject

            card.querySelector(".rejectBtn")
            .onclick = async()=>{

                await updateDoc(
                    doc(db,"news",item.id),
                    {
                        approved:false,
                        status:"Rejected"
                    }
                );

                await logAction(
                    "Rejected news: " +
                    news.title
                );

            };

            // Delete

            card.querySelector(".deleteBtn")
            .onclick = async()=>{

                if(!confirm(
                    "Delete this article?"
                )) return;

                await deleteDoc(
                    doc(db,"news",item.id)
                );

                await logAction(
                    "Deleted news: " +
                    news.title
                );

            };

            // Edit

            card.querySelector(".editBtn")
            .onclick = ()=>{

                alert(
                "Editing module will be added in the next update."
                );

            };

            newsList.appendChild(card);

        });

    });

}

async function logAction(action){

    await addDoc(

        collection(db,"adminLogs"),

        {

            admin:currentUser.uid,

            action:action,

            createdAt:serverTimestamp()

        }

    );

}
