import supabase from "./supabase.js";

/* =========================
   ELEMENTS
========================= */

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("sendButton");
const onlineStatus = document.getElementById("onlineStatus");
const profileName =
    document.getElementById("profileName");
let currentUser = null;
let currentProfileName = "Christian Member";

/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

/* =========================
   GET PROFILE NAME
========================= */

function getProfileName(user) {

    const metadata = user.user_metadata || {};

    return (
        metadata.full_name ||
        metadata.name ||
        metadata.username ||
        metadata.display_name ||
        user.email?.split("@")[0] ||
        "Christian Member"
    );
}

/* =========================
   CHECK LOGIN
========================= */

async function checkLogin() {

    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error || !data.user) {

        window.location.href = "login.html";
        return false;

    }

    currentUser = data.user;

    currentProfileName =
        getProfileName(currentUser);

    return true;
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
   LOAD MESSAGES
========================= */

async function loadMessages() {

    const {
        data,
        error
    } = await supabase
        .from("general_chat_messages")
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
            "CHAT LOAD ERROR:",
            error
        );

        chatMessages.innerHTML = `
            <div class="no-messages">
                Unable to load chat messages.
            </div>
        `;

        return;
    }

    renderMessages(data || []);
}

/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(messages) {

    chatMessages.innerHTML = "";

    if (messages.length === 0) {

        chatMessages.innerHTML = `
            <div class="no-messages">
                💬 No messages yet.
                <br><br>
                Be the first to encourage someone today. ❤️
            </div>
        `;

        return;
    }

    messages.forEach(msg => {
        createMessageBubble(msg);
    });

    scrollToBottom();
}

/* =========================
   CREATE MESSAGE
========================= */

function createMessageBubble(msg) {

    const bubble =
        document.createElement("div");

    const mine =
        msg.user_id === currentUser.id;

    bubble.className =
        mine
            ? "message mine"
            : "message other";

    bubble.dataset.messageId =
        msg.id;

    const name =
        mine
            ? currentProfileName
            : "Christian Member";

    bubble.innerHTML = `

        <div class="message-top">

            <div class="message-name">
                ${escapeHtml(name)}
            </div>

            ${
                mine
                    ? `
                    <div class="message-actions">

                        <button
                            type="button"
                            class="edit-button"
                            data-id="${msg.id}"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            data-id="${msg.id}"
                        >
                            🗑️
                        </button>

                    </div>
                    `
                    : ""
            }

        </div>

        <div class="message-text">
            ${escapeHtml(msg.message)}
        </div>

        <div class="message-time">

            ${formatTime(msg.created_at)}

            ${
                msg.updated_at
                    ? " · edited"
                    : ""
            }

        </div>

    `;

    chatMessages.appendChild(bubble);
}

/* =========================
   SCROLL
========================= */

function scrollToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

/* =========================
   SEND MESSAGE
========================= */

chatForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {
            return;
        }

        const text =
            messageInput.value.trim();

        if (!text) {
            return;
        }

        sendButton.disabled = true;
        sendButton.textContent = "Sending...";

        const {
            error
        } = await supabase
            .from("general_chat_messages")
            .insert({
                user_id:
                    currentUser.id,

                message:
                    text
            });

        if (error) {

            console.error(
                "SEND MESSAGE ERROR:",
                error
            );

            alert(
                "Unable to send your message."
            );

        } else {

            messageInput.value = "";
            messageInput.style.height = "auto";

        }

        sendButton.disabled = false;
        sendButton.textContent = "Send ➤";
    }
);

/* =========================
   EDIT MESSAGE
========================= */

async function editMessage(id) {

    const bubble =
        document.querySelector(
            `[data-message-id="${id}"]`
        );

    if (!bubble) {
        return;
    }

    const textElement =
        bubble.querySelector(
            ".message-text"
        );

    const oldText =
        textElement.textContent.trim();

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

    const cleanedText =
        newText.trim();

    const {
        error
    } = await supabase
        .from("general_chat_messages")
        .update({
            message: cleanedText,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {

        console.error(
            "EDIT MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to edit this message."
        );

        return;
    }
}

/* =========================
   DELETE MESSAGE
========================= */

async function deleteMessage(id) {

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
        .from("general_chat_messages")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);

    if (error) {

        console.error(
            "DELETE MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to delete this message."
        );
    }
}

/* =========================
   MESSAGE BUTTONS
========================= */

chatMessages.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                ".edit-button"
            );

        if (editButton) {

            editMessage(
                editButton.dataset.id
            );

            return;
        }

        const deleteButton =
            event.target.closest(
                ".delete-button"
            );

        if (deleteButton) {

            deleteMessage(
                deleteButton.dataset.id
            );

        }
    }
);

/* =========================
   REALTIME
========================= */

function subscribeToChat() {

    supabase
        .channel("general-chat-room")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "general_chat_messages"
            },
            payload => {

                if (payload.eventType === "INSERT") {

                    addRealtimeMessage(
                        payload.new
                    );

                }

                if (payload.eventType === "UPDATE") {

                    updateRealtimeMessage(
                        payload.new
                    );

                }

                if (payload.eventType === "DELETE") {

                    removeRealtimeMessage(
                        payload.old
                    );

                }

            }
        )
        .subscribe(status => {

            if (
                status === "SUBSCRIBED"
            ) {

                onlineStatus.textContent =
                    "● Connected";

                onlineStatus.style.color =
                    "green";

            } else {

                onlineStatus.textContent =
                    "● Connecting...";

                onlineStatus.style.color =
                    "orange";

            }

        });
}

/* =========================
   REALTIME INSERT
========================= */

function addRealtimeMessage(msg) {

    const existing =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );

    if (existing) {
        return;
    }

    const empty =
        chatMessages.querySelector(
            ".no-messages"
        );

    if (empty) {
        empty.remove();
    }

    createMessageBubble(msg);

    scrollToBottom();
}

/* =========================
   REALTIME UPDATE
========================= */

function updateRealtimeMessage(msg) {

    const oldBubble =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );

    if (!oldBubble) {
        return;
    }

    const newBubble =
        createTemporaryMessage(msg);

    oldBubble.replaceWith(newBubble);
}

/* =========================
   TEMP MESSAGE ELEMENT
========================= */

function createTemporaryMessage(msg) {

    const oldContainer =
        document.createElement("div");

    const mine =
        msg.user_id === currentUser.id;

    oldContainer.className =
        mine
            ? "message mine"
            : "message other";

    oldContainer.dataset.messageId =
        msg.id;

    const name =
        mine
            ? currentProfileName
            : "Christian Member";

    oldContainer.innerHTML = `

        <div class="message-top">

            <div class="message-name">
                ${escapeHtml(name)}
            </div>

            ${
                mine
                    ? `
                    <div class="message-actions">

                        <button
                            type="button"
                            class="edit-button"
                            data-id="${msg.id}"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            data-id="${msg.id}"
                        >
                            🗑️
                        </button>

                    </div>
                    `
                    : ""
            }

        </div>

        <div class="message-text">
            ${escapeHtml(msg.message)}
        </div>

        <div class="message-time">

            ${formatTime(msg.created_at)}

            ${
                msg.updated_at
                    ? " · edited"
                    : ""
            }

        </div>
    `;

    return oldContainer;
}

/* =========================
   REALTIME DELETE
========================= */

function removeRealtimeMessage(msg) {

    const bubble =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );

    if (bubble) {
        bubble.remove();
    }

    if (
        chatMessages.children.length === 0
    ) {

        chatMessages.innerHTML = `
            <div class="no-messages">
                💬 No messages yet.
                <br><br>
                Be the first to encourage someone today. ❤️
            </div>
        `;
    }
}

/* =========================
   TEXTAREA AUTO RESIZE
========================= */

messageInput.addEventListener(
    "input",
    () => {

        messageInput.style.height =
            "auto";

        messageInput.style.height =
            Math.min(
                messageInput.scrollHeight,
                120
            ) + "px";
    }
);

/* =========================
   START
========================= */

(async function () {

    const loggedIn =
        await checkLogin();

    if (!loggedIn) {
        return;
    }

    await loadMessages();

    subscribeToChat();

})();
