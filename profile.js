import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const storage = getStorage();

const profileImage = document.getElementById("profileImage");
const imageInput = document.getElementById("imageInput");

const username = document.getElementById("username");
const admissionNumber = document.getElementById("admissionNumber");
const church = document.getElementById("church");
const bibleVerse = document.getElementById("bibleVerse");
const bio = document.getElementById("bio");

const saveProfile = document.getElementById("saveProfile");

const newsCount = document.getElementById("newsCount");
const prayerCount = document.getElementById("prayerCount");
const chatCount = document.getElementById("chatCount");

let currentUser = null;

// Check login
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    loadProfile();
    loadStatistics();

});

// Load Profile
async function loadProfile() {

    const userRef = doc(db, "users", currentUser.uid);

    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const data = userSnap.data();

    username.value = data.username || "";
    admissionNumber.value = data.admissionNumber || "";
    church.value = data.church || "";
    bibleVerse.value = data.bibleVerse || "";
    bio.value = data.bio || "";

    if (data.photoURL) {
        profileImage.src = data.photoURL;
    }

}

// Save Profile
saveProfile.addEventListener("click", async () => {

    let photoURL = profileImage.src;

    const file = imageInput.files[0];

    if (file) {

        const storageRef = ref(
            storage,
            "profilePictures/" + currentUser.uid
        );

        await uploadBytes(storageRef, file);

        photoURL = await getDownloadURL(storageRef);

    }

    await updateDoc(doc(db, "users", currentUser.uid), {

        username: username.value.trim(),
        church: church.value.trim(),
        bibleVerse: bibleVerse.value.trim(),
        bio: bio.value.trim(),
        photoURL: photoURL

    });

    profileImage.src = photoURL;

    alert("Profile updated successfully.");

});

// Activity Statistics
async function loadStatistics() {

    newsCount.textContent = (
        await getDocs(
            query(
                collection(db, "news"),
                where("uid", "==", currentUser.uid)
            )
        )
    ).size;

    prayerCount.textContent = (
        await getDocs(
            query(
                collection(db, "prayers"),
                where("uid", "==", currentUser.uid)
            )
        )
    ).size;

    chatCount.textContent = (
        await getDocs(
            query(
                collection(db, "messages"),
                where("uid", "==", currentUser.uid)
            )
        )
    ).size;

}
