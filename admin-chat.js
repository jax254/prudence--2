import supabase from "./supabase.js";

/* =========================
   ELEMENTS
========================= */

const messages =
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
   ESCAPE HTML
========================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   FORMAT TIME
========================= */

function formatTime(date) {

    if (!date) {

        return "Just now";

    }

    return new Date(date)
        .toLocaleString(
            [],
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );

}


/* =========================
   CHECK ADMIN
========================= */

async function checkAdmin() {

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser =
        data.user;


    /*
     * Get profile from Supabase.
     *
     * This assumes your users/profile
     * table contains the user's profile.
     */

    const {
        data: profile,
        error: profileError
    } =
    await supabase
        .from("profiles")
        .select(`
            id,
            username,
            full_name,
            role
        `)
        .eq(
            "id",
            currentUser.id
        )
        .maybeSingle();


    if (profileError) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        alert(
            "Unable to load administrator profile."
        );

        return false;

    }


    if (!profile) {

        alert(
            "Administrator profile not found."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    currentProfile =
        profile;


    const allowedRoles = [

        "admin",
        "newsroom",
        "superadmin"

    ];


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
   GET DISPLAY NAME
========================= */

function getDisplayName() {

    return (

        currentProfile?.full_name ||

        currentProfile?.username ||

        currentUser?.user_metadata?.full_name ||

        currentUser?.user_metadata?.name ||

        currentUser?.email?.split("@")[0] ||

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
    } =
    await supabase
        .from(
            "admin_chat_messages"
        )
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


        messages.innerHTML = `

            <p>
                Unable to load admin chat.
            </p>

        `;

        return;

    }


    renderMessages(
        data || []
    );

}


/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(
    messageList
) {

    messages.innerHTML = "";


    if (
        messageList.length === 0
    ) {

        messages.innerHTML = `

            <p>
                💬 No admin messages yet.
            </p>

        `;

        return;

    }


    messageList.forEach(
        msg => {

            createMessage(
                msg
            );

        }
    );


    scrollToBottom();

}


/* =========================
   CREATE MESSAGE
========================= */

function createMessage(
    msg
) {

    const div =
        document.createElement(
            "div"
        );


    const mine =
        msg.user_id ===
        currentUser.id;


    div.className =
        mine
            ? "message mine"
            : "message";


    div.dataset.messageId =
        msg.id;


    /*
     * At the moment we display
     * the current user's real name.
     *
     * For other administrators,
     * the sender name will be loaded
     * from the profile table in the
     * next improvement.
     */

    const senderName =
        mine
            ? getDisplayName()
            : "Administrator";


    div.innerHTML = `

        <div class="message-header">

            <div class="sender">

                👤
                ${escapeHtml(
                    senderName
                )}

            </div>


            <div class="role">

                🛡️
                ${mine
                    ? escapeHtml(
                        currentProfile.role
                    )
                    : "Admin"}

            </div>

        </div>


        <div class="message-content">

            ${escapeHtml(
                msg.message
            )}

        </div>


        <div class="message-footer">

            <span class="time">

                ${formatTime(
                    msg.created_at
                )}

                ${
                    msg.updated_at
                        ? " · edited"
                        : ""
                }

            </span>


            ${
                mine
                    ? `

                        <span
                            class="message-actions"
                        >

                            <button
                                type="button"
                                class="edit-message"
                                data-id="${msg.id}"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="delete-message"
                                data-id="${msg.id}"
                            >
                                🗑️ Delete
                            </button>

                        </span>

                    `
                    : ""
            }

        </div>

    `;


    messages.appendChild(
        div
    );

}


/* =========================
   SEND MESSAGE
========================= */

sendBtn.addEventListener(
    "click",
    async () => {

        const text =
            messageInput.value.trim();


        if (!text) {

            return;

        }


        sendBtn.disabled =
            true;

        sendBtn.textContent =
            "Sending...";


        const {
            error
        } =
        await supabase
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
                "ADMIN CHAT SEND ERROR:",
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
);


/* =========================
   EDIT MESSAGE
========================= */

async function editMessage(
    id
) {

    const bubble =
        document.querySelector(
            `[data-message-id="${id}"]`
        );


    if (!bubble) {

        return;

    }


    const content =
        bubble.querySelector(
            ".message-content"
        );


    const oldText =
        content.textContent.trim();


    const newText =
        prompt(
            "Edit your message:",
            oldText
        );


    if (
        newText === null ||
        !newText.trim()
    ) {

        return;

    }


    const {
        error
    } =
    await supabase
        .from(
            "admin_chat_messages"
        )
        .update({

            message:
                newText.trim(),

            updated_at:
                new Date().toISOString()

        })
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(
            "EDIT ERROR:",
            error
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
    id
) {

    const confirmed =
        confirm(
            "Delete this admin message?"
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
    await supabase
        .from(
            "admin_chat_messages"
        )
        .delete()
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(
            "DELETE ERROR:",
            error
        );


        alert(
            "Unable to delete message."
        );

    }

}


/* =========================
   BUTTON ACTIONS
========================= */

messages.addEventListener(
    "click",
    event => {

        const edit =
            event.target.closest(
                ".edit-message"
            );


        if (edit) {

            editMessage(
                edit.dataset.id
            );

            return;

        }


        const remove =
            event.target.closest(
                ".delete-message"
            );


        if (remove) {

            deleteMessage(
                remove.dataset.id
            );

        }

    }
);


/* =========================
   REALTIME
========================= */

function subscribeToAdminChat() {

    supabase
        .channel(
            "admin-strategy-chat"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table:
                    "admin_chat_messages"
            },
            payload => {

                if (
                    payload.eventType ===
                    "INSERT"
                ) {

                    addRealtimeMessage(
                        payload.new
                    );

                }


                if (
                    payload.eventType ===
                    "UPDATE"
                ) {

                    updateRealtimeMessage(
                        payload.new
                    );

                }


                if (
                    payload.eventType ===
                    "DELETE"
                ) {

                    removeRealtimeMessage(
                        payload.old
                    );

                }

            }
        )
        .subscribe();

}


/* =========================
   REALTIME INSERT
========================= */

function addRealtimeMessage(
    msg
) {

    const existing =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );


    if (existing) {

        return;

    }


    const empty =
        messages.querySelector(
            "p"
        );


    if (
        empty &&
        empty.textContent.includes(
            "No admin messages"
        )
    ) {

        empty.remove();

    }


    createMessage(
        msg
    );


    scrollToBottom();

}


/* =========================
   REALTIME UPDATE
========================= */

function updateRealtimeMessage(
    msg
) {

    const old =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );


    if (!old) {

        return;

    }


    const replacement =
        document.createElement(
            "div"
        );


    const mine =
        msg.user_id ===
        currentUser.id;


    replacement.className =
        mine
            ? "message mine"
            : "message";


    replacement.dataset.messageId =
        msg.id;


    replacement.innerHTML = `

        <div class="message-header">

            <div class="sender">

                👤
                ${mine
                    ? escapeHtml(
                        getDisplayName()
                    )
                    : "Administrator"}

            </div>

            <div class="role">

                🛡️
                ${mine
                    ? escapeHtml(
                        currentProfile.role
                    )
                    : "Admin"}

            </div>

        </div>


        <div class="message-content">

            ${escapeHtml(
                msg.message
            )}

        </div>


        <div class="message-footer">

            <span class="time">

                ${formatTime(
                    msg.created_at
                )}
                · edited

            </span>


            ${
                mine
                    ? `
                        <span
                            class="message-actions"
                        >

                            <button
                                type="button"
                                class="edit-message"
                                data-id="${msg.id}"
                            >
                                ✏️ Edit
                            </button>

                            <button
                                type="button"
                                class="delete-message"
                                data-id="${msg.id}"
                            >
                                🗑️ Delete
                            </button>

                        </span>
                    `
                    : ""
            }

        </div>

    `;


    old.replaceWith(
        replacement
    );

}


/* =========================
   REALTIME DELETE
========================= */

function removeRealtimeMessage(
    msg
) {

    const bubble =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );


    if (bubble) {

        bubble.remove();

    }

}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

    messages.scrollTop =
        messages.scrollHeight;

}


/* =========================
   START
========================= */

(async function () {

    const allowed =
        await checkAdmin();


    if (!allowed) {

        return;

    }


    await loadMessages();

    subscribeToAdminChat();

})();
