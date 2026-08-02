import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const totalUsers = document.getElementById("totalUsers");
const totalAdmins = document.getElementById("totalAdmins");
const totalNews = document.getElementById("totalNews");
const totalPrayers = document.getElementById("totalPrayers");
const totalMessages = document.getElementById("totalMessages");
const totalLives = document.getElementById("totalLives");
const totalNotifications = document.getElementById("totalNotifications");
const websiteVersion = document.getElementById("websiteVersion");
const recentActivity = document.getElementById("recentActivity");

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="../login.html";
        return;

    }

    const profile = await getDoc(doc(db,"users",user.uid));

    if(!profile.exists() || profile.data().role!=="superadmin"){

        alert("Access denied.");

        location.href="../dashboard.html";

        return;

    }

    loadStatistics();

    loadRecentActivity();

});

async function loadStatistics(){

    totalUsers.textContent =
        (await getDocs(collection(db,"users"))).size;

    totalAdmins.textContent =
        (await getDocs(
            query(
                collection(db,"users"),
                where("role","in",[
                    "admin",
                    "newsroom",
                    "superadmin"
                ])
            )
        )).size;

    totalNews.textContent =
        (await getDocs(collection(db,"news"))).size;

    totalPrayers.textContent =
        (await getDocs(collection(db,"prayers"))).size;

    totalMessages.textContent =
        (await getDocs(collection(db,"messages"))).size;

    totalLives.textContent =
        (await getDocs(collection(db,"liveStreams"))).size;

    totalNotifications.textContent =
        (await getDocs(collection(db,"notifications"))).size;

    const version = await getDoc(doc(db,"settings","version"));

    if(version.exists()){

        websiteVersion.textContent =
            version.data().version;

    }

}

function loadRecentActivity(){

    const q = query(

        collection(db,"adminLogs"),

        orderBy("createdAt","desc"),

        limit(20)

    );

    onSnapshot(q,(snapshot)=>{

        recentActivity.innerHTML="";

        if(snapshot.empty){

            recentActivity.innerHTML=
            "<p>No recent activity.</p>";

            return;

        }

        snapshot.forEach((item)=>{

            const log = item.data();

            recentActivity.innerHTML += `

            <div class="log">

                <strong>

                    ${log.action}

                </strong>

                <br>

                <small>

                    ${
                        log.createdAt
                        ?
                        log.createdAt
                        .toDate()
                        .toLocaleString()
                        :
                        "Just now"
                    }

                </small>

            </div>

            `;

        });

    });

}
