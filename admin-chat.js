import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const messagesContainer =
    document.getElementById("messages");

const sendBtn =
    document.getElementById("sendBtn");

const messageInput =
    document.getElementById("message");


/* =========================
   CURRENT USER
========================= */

let currentUser = null;
let currentProfile = null;


/* =========================
   ALLOWED ADMIN ROLES
========================= */

const allowedRoles = [
    "admin",
    "newsroom",
    "superadmin"
];


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================
   FORMAT TIME
========================= */

function formatTime(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString(
        [],
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


/* =========================
   CHECK LOGIN + ADMIN ROLE
========================= */

async function checkAccess() {

    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (
        error ||
        !data ||
        !data.user
    ) {

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser =
        data.user;


    /*
     * Load profile from Supabase
     */

    const {
        data: profile,
        error: profileError
    } = await supabase

        .from("profiles")

        .select(`
            id,
            username,
            public_username,
            profile_photo,
            role
        `)

        .eq(
            "id",
            currentUser.id
        )

        .single();


    if (
        profileError ||
        !profile
    ) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        alert(
            "Your profile could not be loaded."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    currentProfile =
        profile;


    /*
     * Check admin role
     */

    if (
        !allowedRoles.includes(
            currentProfile.role
        )
    ) {

        alert(
            "You are not authorized to access Admin Chat."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    return true;

}


/* =========================
   GET PROFILE NAME
========================= */

function getProfileName(profile) {

    return (
        profile?.public_username ||
        profile?.username ||
        "Administrator"
    );

}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages() {

    const {
        data,
        error
    } = await supabase

        .from("admin_chat_messages")

        .select(`
            id,
            user_id,
            message,
            created_at,
            updated_at
        `)

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "ADMIN CHAT LOAD ERROR:",
            error
        );

        messagesContainer.innerHTML = `
            <p>
                Unable to load admin messages.
            </p>
        `;

        return;

    }


    await renderMessages(
        data || []
    );

}


/* =========================
   LOAD PROFILES
========================= */

async function getProfiles(userIds) {

    if (!userIds.length) {
        return {};
    }


    const {
        data,
        error
    } = await supabase

        .from("profiles")

        .select(`
            id,
            username,
            public_username,
            profile_photo,
            role
        `)

        .in(
            "id",
            userIds
        );


    if (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

        return {};

    }


    const profileMap = {};


    data.forEach(
        profile => {

            profileMap[
                profile.id
            ] = profile;

        }
    );


    return profileMap;

}


/* =========================
   RENDER MESSAGES
========================= */

async function renderMessages(
    messageList
) {

    messagesContainer.innerHTML = "";


    if (
        messageList.length === 0
    ) {

        messagesContainer.innerHTML = `
            <p class="no-messages">
                No admin messages yet.
            </p>
        `;

        return;

    }


    /*
     * Get all unique user IDs
     */

    const userIds = [
        ...new Set(
            messageList.map(
                message =>
                    message.user_id
            )
        )
    ];


    const profiles =
        await getProfiles(
            userIds
        );


    messageList.forEach(
        message => {

            renderSingleMessage(
                message,
                profiles[
                    message.user_id
                ]
            );

        }
    );


    scrollToBottom();

}


/* =========================
   RENDER ONE MESSAGE
========================= */

function renderSingleMessage(
    message,
    profile
) {

    const div =
        document.createElement("div");


    const mine =
        message.user_id ===
        currentUser.id;


    div.className =
        mine
            ? "message mine"
            : "message";


    div.dataset.messageId =
        message.id;


    const name =
        getProfileName(
            profile
        );


    const role =
        profile?.role ||
        "admin";


    const photo =
        profile?.profile_photo;


    const avatarHTML =
        photo
            ? `
                <img
                    src="${escapeHtml(photo)}"
                    class="admin-avatar"
                    alt="Profile"
                >
              `
            : `
                <div class="admin-avatar-placeholder">
                    ✝
                </div>
              `;


    const edited =
        message.updated_at &&
        message.created_at &&
        new Date(
            message.updated_at
        ).getTime() >
        new Date(
            message.created_at
        ).getTime()
            ? `<span class="edited">(edited)</span>`
            : "";


    div.innerHTML = `

        <div class="message-header">

            ${avatarHTML}

            <div class="admin-info">

                <div class="sender">

                    ${escapeHtml(name)}

                </div>

                <div class="role">

                    ${escapeHtml(role)}

                </div>

            </div>

        </div>


        <div
            class="message-text"
            data-text
        >

            ${escapeHtml(
                message.message
            )}

            ${edited}

        </div>


        <div class="time">

            ${formatTime(
                message.created_at
            )}

        </div>


        ${
            mine
                ? `
                    <div class="message-actions">

                        <button
                            type="button"
                            class="edit-btn"
                            data-edit="${message.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-delete="${message.id}"
                        >
                            Delete
                        </button>

                    </div>
                  `
                : ""
        }

    `;


    messagesContainer.appendChild(
        div
    );

}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}


/* =========================
   SEND MESSAGE
========================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        return;
    }


    sendBtn.disabled =
        true;

    sendBtn.textContent =
        "SENDING...";


    const {
        error
    } = await supabase

        .from(
            "admin_chat_messages"
        )

        .insert({

            user_id:
                currentUser.id,

            message:
                text

        });


    if (error) {

        console.error(
            "SEND ADMIN MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to send message."
        );

    }
    else {

        messageInput.value =
            "";

    }


    sendBtn.disabled =
        false;

    sendBtn.textContent =
        "SEND";

}


/* =========================
   EDIT MESSAGE
========================= */

async function editMessage(
    messageId
) {

    const {
        data,
        error
    } = await supabase

        .from(
            "admin_chat_messages"
        )

        .select(
            "message,user_id"
        )

        .eq(
            "id",
            messageId
        )

        .single();


    if (
        error ||
        !data
    ) {

        alert(
            "Message could not be found."
        );

        return;

    }


    /*
     * Extra client-side ownership check
     */

    if (
        data.user_id !==
        currentUser.id
    ) {

        alert(
            "You can only edit your own messages."
        );

        return;

    }


    const newText =
        prompt(
            "Edit your message:",
            data.message
        );


    if (
        newText === null
    ) {

        return;

    }


    const cleanText =
        newText.trim();


    if (!cleanText) {

        alert(
            "Message cannot be empty."
        );

        return;

    }


    const {
        error: updateError
    } = await supabase

        .from(
            "admin_chat_messages"
        )

        .update({

            message:
                cleanText,

            updated_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            messageId
        )

        .eq(
            "user_id",
            currentUser.id
        );


    if (updateError) {

        console.error(
            "EDIT MESSAGE ERROR:",
            updateError
        );

        alert(
            "Unable to edit message."
        );

    }

}


/* =========================
   DELETE MESSAGE
========================= */

async function deleteMessage(
    messageId
) {

    const confirmed =
        confirm(
            "Delete this message?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabase

        .from(
            "admin_chat_messages"
        )

        .delete()

        .eq(
            "id",
            messageId
        )

        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(
            "DELETE MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to delete message."
        );

    }

}


/* =========================
   EDIT / DELETE BUTTONS
========================= */

messagesContainer.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                "[data-edit]"
            );


        if (editButton) {

            editMessage(
                editButton.dataset.edit
            );

            return;

        }


        const deleteButton =
            event.target.closest(
                "[data-delete]"
            );


        if (deleteButton) {

            deleteMessage(
                deleteButton.dataset.delete
            );

        }

    }
);


/* =========================
   REALTIME
========================= */

function subscribeToChat() {

    supabase

        .channel(
            "admin-chat-room"
        )

        .on(

            "postgres_changes",

            {
                event: "*",
                schema: "public",
                table: "admin_chat_messages"
            },

            async () => {

                /*
                 * Reload after INSERT,
                 * UPDATE or DELETE.
                 *
                 * This keeps profile names,
                 * edits and deletions synchronized.
                 */

                await loadMessages();

            }

        )

        .subscribe(
            status => {

                console.log(
                    "ADMIN CHAT REALTIME:",
                    status
                );

            }
        );

}


/* =========================
   START
========================= */

(async function () {

    const allowed =
        await checkAccess();


    if (!allowed) {
        return;
    }


    await loadMessages();


    subscribeToChat();

})();
