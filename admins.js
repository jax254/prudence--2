import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const adminEmail = document.getElementById("adminEmail");
const adminRole = document.getElementById("adminRole");
const addAdmin = document.getElementById("addAdmin");

const adminsContainer = document.getElementById("adminsContainer");
const adminTemplate = document.getElementById("adminTemplate");
const searchAdmin = document.getElementById("searchAdmin");

let currentUser;
let admins = [];

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "../login.html";
        return;
    }

    currentUser = user;

    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
        location.href = "../dashboard.html";
        return;
    }

    const profile = userSnap.data();

    if (profile.role !== "superadmin") {
        alert("Access denied.");
        location.href = "../dashboard.html";
        return;
    }

    loadAdmins();

});

// Load Admins
async function loadAdmins() {

    admins = [];

    const snapshot = await getDocs(collection(db, "users"));

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        if (
            data.role === "admin" ||
            data.role === "newsroom" ||
            data.role === "superadmin"
        ) {

            admins.push({
                id: docSnap.id,
                ...data
            });

        }

    });

    displayAdmins(admins);

}

// Display Admins
function displayAdmins(list) {

    adminsContainer.innerHTML = "";

    if (list.length === 0) {

        adminsContainer.innerHTML =
            "<p>No administrators found.</p>";

        return;

    }

    list.forEach((admin) => {

        const card = adminTemplate.content.cloneNode(true);

        card.querySelector(".name").textContent =
            admin.username || "No Name";

        card.querySelector(".email").textContent =
            admin.email;

        card.querySelector(".role").textContent =
            "Role: " + admin.role;

        // Promote
        card.querySelector(".promote").onclick = async () => {

            let newRole = prompt(
                "Enter role: admin, newsroom or superadmin"
            );

            if (!newRole) return;

            newRole = newRole.toLowerCase();

            if (
                !["admin", "newsroom", "superadmin"].includes(newRole)
            ) {

                alert("Invalid role.");

                return;

            }

            await updateDoc(
                doc(db, "users", admin.id),
                {
                    role: newRole
                }
            );

            await logActivity(
                "Promoted " + admin.email + " to " + newRole
            );

            loadAdmins();

        };

        // Demote
        card.querySelector(".demote").onclick = async () => {

            await updateDoc(
                doc(db, "users", admin.id),
                {
                    role: "user"
                }
            );

            await logActivity(
                "Demoted " + admin.email
            );

            loadAdmins();

        };

        // Remove
        card.querySelector(".remove").onclick = async () => {

            if (!confirm("Remove administrator?"))
                return;

            await updateDoc(
                doc(db, "users", admin.id),
                {
                    role: "user"
                }
            );

            await logActivity(
                "Removed " + admin.email
            );

            loadAdmins();

        };

        adminsContainer.appendChild(card);

    });

}

// Search
searchAdmin.addEventListener("input", () => {

    const keyword = searchAdmin.value.toLowerCase();

    const filtered = admins.filter(admin =>

        (admin.username || "")
        .toLowerCase()
        .includes(keyword)

        ||

        (admin.email || "")
        .toLowerCase()
        .includes(keyword)

    );

    displayAdmins(filtered);

});

// Send Invitation
addAdmin.addEventListener("click", async () => {

    if (adminEmail.value.trim() === "") {

        alert("Enter an email.");

        return;

    }

    await addDoc(
        collection(db, "adminInvitations"),
        {

            email: adminEmail.value.trim(),

            role: adminRole.value,

            status: "Pending",

            createdAt: serverTimestamp(),

            invitedBy: currentUser.uid

        }
    );

    await logActivity(
        "Invited " + adminEmail.value
    );

    alert("Invitation created.");

    adminEmail.value = "";

});

// Activity Log
async function logActivity(action) {

    await addDoc(
        collection(db, "adminLogs"),
        {

            action,

            performedBy: currentUser.uid,

            createdAt: serverTimestamp()

        }
    );

}
