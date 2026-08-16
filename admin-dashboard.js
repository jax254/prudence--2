import { auth, db } from "./firebase.js";
import supabase from "./supabase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");

const usersCount = document.getElementById("usersCount");
const newsCount = document.getElementById("newsCount");
const liveCount = document.getElementById("liveCount");
const pendingCount = document.getElementById("pendingCount");

const pendingNews = document.getElementById("pendingNews");
const notificationBadge =
    document.getElementById(
        "notificationBadge"
    );
// Check logged in user
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    const userRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {

        alert("Access denied.");

        window.location.href = "../index.html";

        return;

    }

    const data = userSnap.data();

    if (
        data.role !== "admin" &&
        data.role !== "newsroom" &&
        data.role !== "superadmin"
    ) {

        alert("You are not authorized.");

        window.location.href="../index.html";

        return;

    }

    adminName.textContent = data.username;
    adminRole.textContent = data.role.toUpperCase();

    loadStatistics();
    loadPendingNews();

});

// Load dashboard statistics
async function loadStatistics(){

    usersCount.textContent =
        (await getDocs(collection(db,"users"))).size;

    newsCount.textContent =
        (await getDocs(collection(db,"news"))).size;

    liveCount.textContent =
        (await getDocs(collection(db,"liveStreams"))).size;

    pendingCount.textContent =
        (await getDocs(
            query(
                collection(db,"news"),
                where("approved","==",false)
            )
        )).size;

}

// Load pending news
function loadPendingNews(){

    const q=query(

        collection(db,"news"),

        where("approved","==",false)

    );

    onSnapshot(q,(snapshot)=>{

        pendingNews.innerHTML="";

        if(snapshot.empty){

            pendingNews.innerHTML="<p>No pending news.</p>";

            return;

        }

        snapshot.forEach((document)=>{

            const news=document.data();

            pendingNews.innerHTML+=`

            <div style="
                padding:15px;
                margin-bottom:15px;
                border:1px solid #ddd;
                border-radius:10px;
                background:#f8f8f8;
            ">

                <h3>${news.title}</h3>

                <p>${news.author}</p>

                <p>${news.content.substring(0,200)}...</p>

            </div>

            `;

        });

    });

}

// Logout
window.logout = async function(){

    await signOut(auth);

    window.location.href="../index.html";

};
