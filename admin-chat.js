import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const messagesContainer =
    document.getElementById("messages");

const messageInput =
    document.getElementById("message");

const sendBtn =
    document.getElementById("sendBtn");

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );


/* =========================
   STATE
========================= */

let currentUser = null;

let currentProfile = null;

let editingMessageId = null;


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value){

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================
   CHECK LOGIN
========================= */

async function checkLogin(){

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if(
        error ||
        !data.user
    ){

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser =
        data.user;

    return true;

}


/* =========================
   LOAD PROFILE
========================= */

async function loadProfile(){

    const {
        data,
        error
    } =
    await supabase

        .from("profiles")

        .select(`
            id,
            username,
            public_username,
            email,
            role,
            status
        `)

        .eq(
            "id",
            currentUser.id
        )

        .maybeSingle();


    if(error){

        console.error(
            "PROFILE ERROR:",
            error
        );

        alert(
            "Unable to load administrator profile."
        );

        return false;

    }


    if(!data){

        alert(
            "Your administrator profile was not found."
        );

        return false;

    }


    const allowedRoles = [

        "admin",

        "newsroom",

        "superadmin"

    ];


    if(
        !allowedRoles.includes(
            data.role
        )
    ){

        alert(
            "You are not authorized to use Admin Chat."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    if(
        data.status &&
        data.status !== "active"
    ){

        alert(
            "Your administrator account is not active."
        );

        window.location.href =
            "../login.html";

        return false;

    }


    currentProfile =
        data;

    return true;

}


/* =========================
   GET DISPLAY NAME
========================= */

function getDisplayName(){

    if(
        currentProfile?.username
    ){

        return currentProfile.username;

    }


    if(
        currentProfile?.public_username
    ){

        return currentProfile.public_username;

    }


    if(
        currentProfile?.email
    ){

        return currentProfile.email;

    }


    return "Administrator";

}


/* =========================
   FORMAT TIME
========================= */

function formatTime(date){

    if(!date){

        return "Just now";

    }


    return new Date(
        date
    ).toLocaleString(
        [],
        {
            dateStyle:"short",
            timeStyle:"short"
        }
    );

}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages(){

    messagesContainer.innerHTML = `

        <div class="loading">
            Loading admin messages...
        </div>

    `;


    const {
        data,
        error
    } =
    await supabase

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
                ascending:true
            }
        );


    if(error){

        console.error(
            "ADMIN CHAT LOAD ERROR:",
            error
        );


        messagesContainer.innerHTML = `

            <div class="no-messages">

                Unable to load admin chat.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

        return;

    }


    renderMessages(
        data || []
    );

}


/* =========================
   RENDER
========================= */

function renderMessages(
    data
){

    messagesContainer.innerHTML =
        "";


    if(
        !data ||
        data.length === 0
    ){

        messagesContainer.innerHTML = `

            <div class="no-messages">

                💬 No admin messages yet.

                <br><br>

                Start the private conversation.

            </div>

        `;

        return;

    }


    data.forEach(
        renderMessage
    );


    scrollToBottom();

}


/* =========================
   RENDER ONE MESSAGE
========================= */

function renderMessage(
    msg
){

    const bubble =
        document.createElement(
            "div"
        );


    const mine =
        msg.user_id ===
        currentUser.id;


    bubble.className =
        mine
            ? "message mine"
            : "message";


    bubble.dataset.messageId =
        msg.id;


    const name =
        mine
            ? getDisplayName()
            : "Administrator";


    bubble.innerHTML = `

        <div class="message-header">

            <span class="sender">

                ${escapeHtml(name)}

            </span>

            <span class="role">

                ADMIN

            </span>

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
                    msg.updated_at &&
                    msg.updated_at !==
                    msg.created_at
                        ? " · edited"
                        : ""
                }

            </span>


            ${
                mine
                    ? `

                        <div
                            class="message-actions"
                        >

                            <button
                                type="button"
                                class="edit-message"
                                data-id="${msg.id}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="delete-message"
                                data-id="${msg.id}"
                            >
                                Delete
                            </button>

                        </div>

                    `
                    : ""
            }

        </div>

    `;


    messagesContainer.appendChild(
        bubble
    );

}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(){

    const text =
        messageInput.value.trim();


    if(!text){

        return;

    }


    if(!currentUser){

        alert(
            "You are not logged in."
        );

        return;

    }


    /* =========================
       EDIT MODE
    ========================= */

    if(editingMessageId){

        sendBtn.disabled =
            true;

        sendBtn.textContent =
            "Saving...";


        const {
            error
        } =
        await supabase

            .from(
                "admin_chat_messages"
            )

            .update({

                message:text,

                updated_at:
                    new Date().toISOString()

            })

            .eq(
                "id",
                editingMessageId
            )

            .eq(
                "user_id",
                currentUser.id
            );


        sendBtn.disabled =
            false;


        sendBtn.textContent =
            "SEND ➤";


        if(error){

            console.error(
                "EDIT ERROR:",
                error
            );

            alert(
                "Unable to edit message:\n" +
                error.message
            );

            return;

        }


        editingMessageId =
            null;

        messageInput.value =
            "";

        loadMessages();

        return;

    }


    /* =========================
       NEW MESSAGE
    ========================= */

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


    sendBtn.disabled =
        false;

    sendBtn.textContent =
        "SEND ➤";


    if(error){

        console.error(
            "SEND ERROR:",
            error
        );


        alert(
            "Unable to send message:\n" +
            error.message
        );

        return;

    }


    messageInput.value =
        "";

}


/* =========================
   EDIT MESSAGE
========================= */

async function editMessage(
    id
){

    const {
        data,
        error
    } =
    await supabase

        .from(
            "admin_chat_messages"
        )

        .select(
            "id,message,user_id"
        )

        .eq(
            "id",
            id
        )

        .eq(
            "user_id",
            currentUser.id
        )

        .maybeSingle();


    if(error){

        console.error(
            "GET MESSAGE ERROR:",
            error
        );

        alert(
            "Unable to edit message."
        );

        return;

    }


    if(!data){

        alert(
            "You can only edit your own messages."
        );

        return;

    }


    editingMessageId =
        id;


    messageInput.value =
        data.message;


    messageInput.focus();


    sendBtn.textContent =
        "SAVE EDIT";


    messageInput.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });

}


/* =========================
   DELETE MESSAGE
========================= */

async function deleteMessage(
    id
){

    const confirmed =
        confirm(
            "Delete this admin message?"
        );


    if(!confirmed){

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


    if(error){

        console.error(
            "DELETE ERROR:",
            error
        );


        alert(
            "Unable to delete message:\n" +
            error.message
        );

        return;

    }


    loadMessages();

}


/* =========================
   MESSAGE BUTTONS
========================= */

messagesContainer.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                ".edit-message"
            );


        if(editButton){

            editMessage(
                editButton.dataset.id
            );

            return;

        }


        const deleteButton =
            event.target.closest(
                ".delete-message"
            );


        if(deleteButton){

            deleteMessage(
                deleteButton.dataset.id
            );

        }

    }
);


/* =========================
   REALTIME
========================= */

function subscribeToChat(){

    const channel =
        supabase

            .channel(
                "admin-chat-room"
            )

            .on(
                "postgres_changes",

                {
                    event:"*",

                    schema:"public",

                    table:
                        "admin_chat_messages"

                },

                () => {

                    loadMessages();

                }

            )

            .subscribe(
                status => {

                    if(
                        status ===
                        "SUBSCRIBED"
                    ){

                        connectionStatus.textContent =
                            "● Connected";

                        connectionStatus.style.color =
                            "green";

                    }

                    else{

                        connectionStatus.textContent =
                            "● Connecting...";

                        connectionStatus.style.color =
                            "#d98b00";

                    }

                }
            );


    return channel;

}


/* =========================
   SCROLL
========================= */

function scrollToBottom(){

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================
   CTRL + ENTER
========================= */

messageInput.addEventListener(
    "keydown",
    event => {

        if(
            event.ctrlKey &&
            event.key === "Enter"
        ){

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================
   START
========================= */

(async function(){

    try{

        const loggedIn =
            await checkLogin();


        if(!loggedIn){

            return;

        }


        const profileLoaded =
            await loadProfile();


        if(!profileLoaded){

            return;

        }


        await loadMessages();


        subscribeToChat();

    }

    catch(error){

        console.error(
            "ADMIN CHAT ERROR:",
            error
        );


        messagesContainer.innerHTML = `

            <div class="no-messages">

                Something went wrong loading
                Admin Chat.

            </div>

        `;

    }

})();
