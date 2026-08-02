import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const CURRENT_VERSION = "2.0.0";

const currentVersion = document.getElementById("currentVersion");
const latestVersion = document.getElementById("latestVersion");
const status = document.getElementById("status");
const releaseNotes = document.getElementById("releaseNotes");
const updateBtn = document.getElementById("updateBtn");

currentVersion.textContent = CURRENT_VERSION;

loadUpdates();

async function loadUpdates() {

    try {

        const versionRef = doc(db, "settings", "version");

        const versionSnap = await getDoc(versionRef);

        if (!versionSnap.exists()) {

            latestVersion.textContent = CURRENT_VERSION;

            status.textContent = "No version information found.";

            updateBtn.style.display = "none";

            return;

        }

        const data = versionSnap.data();

        latestVersion.textContent = data.version;

        if (data.version !== CURRENT_VERSION) {

            status.innerHTML = "ðŸŸ¢ A new update is available.";

            updateBtn.style.display = "block";

        } else {

            status.innerHTML = "âœ… You are using the latest version.";

            updateBtn.style.display = "none";

        }

        // Release Notes
        releaseNotes.innerHTML = "";

        if (data.notes && data.notes.length > 0) {

            const ul = document.createElement("ul");

            data.notes.forEach(note => {

                const li = document.createElement("li");

                li.textContent = note;

                ul.appendChild(li);

            });

            releaseNotes.appendChild(ul);

        } else {

            releaseNotes.innerHTML =
                "<p>No release notes available.</p>";

        }

    } catch (error) {

        console.error(error);

        status.textContent =
            "Unable to check for updates.";

    }

}

updateBtn.addEventListener("click", () => {

    alert(
        "A new version is available. After deploying the latest version to Firebase Hosting, refresh this page to use the updated website."
    );

    window.location.reload();

});
