import supabase from "./supabase.js";

const username = document.getElementById("username");
const admissionNumber = document.getElementById("admissionNumber");
const prudenceId = document.getElementById("prudenceId");
const postComment = document.getElementById("postComment");
const comment = document.getElementById("comment");
const commentsContainer = document.getElementById("commentsContainer");
const notificationBadge =
    document.getElementById("notificationBadge");
let currentUser = null;

// =========================
// LOAD UNREAD NOTIFICATIONS
// =========================

async function loadNotificationCount(){

    if(!currentUser){

        return;

    }

    const {
        count,
        error
    } =
    await supabase
        .from("notifications")
        .select(
            "id",
            {
                count:"exact",
                head:true
            }
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            "is_read",
            false
        );


    if(error){

        console.error(
            "NOTIFICATION COUNT ERROR:",
            error
        );

        return;

    }


    if(
        count &&
        count > 0
    ){

        notificationBadge.textContent =
            count > 99
                ? "99+"
                : count;

        notificationBadge.style.display =
            "inline-flex";

    }
    else{

        notificationBadge.style.display =
            "none";

    }

}
// Load logged-in user
async function loadUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (profileError || !profile) {
        console.error(profileError);
        alert("User profile not found.");
        return;
    }

    username.textContent = profile.username || "User";

    admissionNumber.textContent =
        profile.admission_number || "Not Provided";
    prudenceId.textContent =
    profile.prudence_id || "Not Assigned";

    if (profile.status === "suspended") {

        postComment.disabled = true;
        comment.disabled = true;

        alert("Your account has been suspended.");

    }

}


// Post comment
if (postComment) {

    postComment.addEventListener("click", async () => {

        if (!currentUser) return;

        const message = comment.value.trim();

        if (!message) {

            alert("Please write a comment.");
            return;

        }

        const { error } = await supabase
            .from("comments")
            .insert({
                user_id: currentUser.id,
                message: message
            });

        if (error) {

            console.error(error);
            alert("Unable to post comment.");
            return;

        }

        comment.value = "";

        loadComments();

    });

}


// Load comments
async function loadComments() {

    const { data, error } = await supabase
        .from("comments")
        .select(`
            id,
            message,
            created_at,
            profiles (
                username,
                prudence_id
            )
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        commentsContainer.innerHTML =
            "<p>Unable to load comments.</p>";

        return;

    }

    commentsContainer.innerHTML = "";

    if (!data || data.length === 0) {

        commentsContainer.innerHTML =
            "<p>No comments yet.</p>";

        return;

    }

    data.forEach(item => {

        const div = document.createElement("div");

        div.className = "comment";

        const name =
            item.profiles?.username || "Anonymous";

        const message =
            item.message || "";

        div.innerHTML = `
            <strong>${escapeHTML(name)}</strong>
            <p>${escapeHTML(message)}</p>
        `;

        commentsContainer.appendChild(div);

    });

}


// Basic protection against HTML injection
function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// Start
loadUser();
loadComments();        
