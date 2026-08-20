import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const chatMessages =
    document.getElementById(
        "chatMessages"
    );


const chatForm =
    document.getElementById(
        "chatForm"
    );


const messageInput =
    document.getElementById(
        "message"
    );


const sendButton =
    document.getElementById(
        "sendButton"
    );


const onlineStatus =
    document.getElementById(
        "onlineStatus"
    );


/* =========================
   CURRENT USER
========================= */

let currentUser = null;


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text){

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text || "";

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
            "login.html";

        return false;

    }


    currentUser =
        data.user;

    return true;

}


/* =========================
   FORMAT TIME
========================= */

function formatTime(date){

    if(!date){

        return "";

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

    const {
        data,
        error
    } =
    await supabase

        .from(
            "general_chat_messages"
        )

        .select(`
            id,
            user_id,
            message,
            created_at
        `)

        .order(
            "created_at",
            {
                ascending:true
            }
        );


    if(error){

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


    renderMessages(
        data || []
    );

}


/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(
    messages
){

    chatMessages.innerHTML =
        "";


    if(
        messages.length === 0
    ){

        chatMessages.innerHTML = `

            <div class="no-messages">

                💬 No messages yet.

                <br><br>

                Be the first to encourage
                someone today. ❤️

            </div>

        `;

        return;

    }


    messages.forEach(
        msg => {

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
                    : "message other";


            bubble.innerHTML = `

                <div class="message-name">

                    ${mine
                        ? "You"
                        : "Christian Member"}

                </div>


                <div class="message-text">

                    ${escapeHtml(
                        msg.message
                    )}

                </div>


                <div class="message-time">

                    ${formatTime(
                        msg.created_at
                    )}

                </div>

            `;


            chatMessages.appendChild(
                bubble
            );

        }
    );


    scrollToBottom();

}


/* =========================
   SCROLL
========================= */

function scrollToBottom(){

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


        if(!currentUser){

            return;

        }


        const text =
            messageInput.value.trim();


        if(!text){

            return;

        }


        sendButton.disabled =
            true;


        sendButton.textContent =
            "Sending...";


        const {
            error
        } =
        await supabase

            .from(
                "general_chat_messages"
            )

            .insert({

                user_id:
                    currentUser.id,

                message:
                    text

            });


        if(error){

            console.error(
                "SEND MESSAGE ERROR:",
                error
            );


            alert(
                "Unable to send your message."
            );


        }

        else{

            messageInput.value =
                "";

        }


        sendButton.disabled =
            false;


        sendButton.textContent =
            "Send ➤";

    }
);


/* =========================
   REALTIME
========================= */

function subscribeToChat(){

    supabase

        .channel(
            "general-chat-room"
        )

        .on(

            "postgres_changes",

            {
                event:"INSERT",

                schema:"public",

                table:
                    "general_chat_messages"

            },

            payload => {

                const newMessage =
                    payload.new;


                addRealtimeMessage(
                    newMessage
                );

            }

        )

        .subscribe(
            status => {

                if(
                    status ===
                    "SUBSCRIBED"
                ){

                    onlineStatus.textContent =
                        "● Connected";

                    onlineStatus.style.color =
                        "green";

                }

                else{

                    onlineStatus.textContent =
                        "● Connecting...";

                    onlineStatus.style.color =
                        "orange";

                }

            }
        );

}


/* =========================
   ADD REALTIME MESSAGE
========================= */

function addRealtimeMessage(
    msg
){

    /*
     * Prevent duplicate message
     * if it is already displayed.
     */

    const existing =
        document.querySelector(
            `[data-message-id="${msg.id}"]`
        );


    if(existing){

        return;

    }


    /*
     * Remove empty message notice.
     */

    const empty =
        chatMessages.querySelector(
            ".no-messages"
        );


    if(empty){

        empty.remove();

    }


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
            : "message other";


    bubble.dataset.messageId =
        msg.id;


    bubble.innerHTML = `

        <div class="message-name">

            ${mine
                ? "You"
                : "Christian Member"}

        </div>


        <div class="message-text">

            ${escapeHtml(
                msg.message
            )}

        </div>


        <div class="message-time">

            ${formatTime(
                msg.created_at
            )}

        </div>

    `;


    chatMessages.appendChild(
        bubble
    );


    scrollToBottom();

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

(async function(){

    const loggedIn =
        await checkLogin();


    if(!loggedIn){

        return;

    }


    await loadMessages();


    subscribeToChat();

})();        
