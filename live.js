import supabase from "./supabase.js";
console.log("Prudence 2 live.js loaded");
const startLive = document.getElementById("startLive");
const joinLive = document.getElementById("joinLive");
const endLive = document.getElementById("endLive");
const statusText = document.getElementById("status");
const videoElement = document.getElementById("liveVideo");
const requestBroadcast =
    document.getElementById("requestBroadcast");

const broadcastRequestStatus =
    document.getElementById("broadcastRequestStatus");
// Your LiveKit WebSocket URL
const LIVEKIT_WS_URL = "wss://prudence-2-live-00bm3cbr.livekit.cloud";

// Supabase Edge Function
const TOKEN_FUNCTION =
    "https://mreqwrdkucggwvxvturl.supabase.co/functions/v1/livekit-token";

let room = null;


// --------------------------------------------------
// GET LOGGED-IN USER
// --------------------------------------------------

async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Please log in before using Live.");
    }

    return user;
}


// --------------------------------------------------
// GET LIVEKIT TOKEN
// --------------------------------------------------

async function getLiveKitToken(mode) {

    const user = await getCurrentUser();

    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("Your login session has expired. Please log in again.");
    }

    const participantIdentity = user.id;

    const participantName =
        user.user_metadata?.username ||
        user.email ||
        "Prudence User";

    const response = await fetch(TOKEN_FUNCTION, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        },

        body: JSON.stringify({

            roomName: "prudence-live-main",

            participantName: participantName,

            participantIdentity: participantIdentity,

            mode: mode
        })
    });


    const data = await response.json();

    console.log("Token function response:", data);


    if (!response.ok) {

        throw new Error(
            data.error ||
            `Token function failed (${response.status})`
        );
    }


    if (!data.token) {

        throw new Error("No LiveKit token was received.");
    }


    return data.token;
}


// --------------------------------------------------
// START LIVE
// --------------------------------------------------

startLive.addEventListener("click", async () => {

    try {

        statusText.textContent = "Checking broadcaster approval...";

        const token = await getLiveKitToken("broadcaster");

        statusText.textContent = "Connecting to LiveKit...";


        // Disconnect previous room
        if (room) {
            room.disconnect();
            room = null;
        }


        room = new LivekitClient.Room();


        // Listen for connection
        room.on(
            LivekitClient.RoomEvent.Connected,
            () => {

                console.log("Broadcaster connected.");

                statusText.textContent = "LIVE — Broadcasting";
            }
        );


        // Local camera/microphone
        room.on(
            LivekitClient.RoomEvent.LocalTrackPublished,
            publication => {

                const track = publication.track;

                if (track) {

                    const element =
                        track.attach();

                    element.autoplay = true;
                    element.playsInline = true;

                    if (track.kind === "video") {

                        videoElement.srcObject =
                            element.srcObject;
                    }
                }
            }
        );


        // Connect
        await room.connect(
            LIVEKIT_WS_URL,
            token
        );


        // Create camera + microphone
        const tracks =
            await LivekitClient.createLocalTracks({
                audio: true,
                video: true
            });


        // Publish tracks
        for (const track of tracks) {

            await room.localParticipant.publishTrack(track);
        }


        // Show local video
        for (const track of tracks) {

            if (track.kind === "video") {

                const element = track.attach();

                element.autoplay = true;
                element.playsInline = true;
                element.muted = true;

                videoElement.replaceWith(element);

                element.id = "liveVideo";
            }
        }


        statusText.textContent = "🔴 LIVE — Broadcasting";


    } catch (error) {

        console.error("Start Live error:", error);

        statusText.textContent = "Ready";

        alert(error.message);
    }

});


// --------------------------------------------------
// JOIN LIVE
// --------------------------------------------------

joinLive.addEventListener("click", async () => {

    try {

        statusText.textContent = "Joining live...";


        const token =
            await getLiveKitToken("viewer");


        if (room) {

            room.disconnect();
            room = null;
        }


        room = new LivekitClient.Room();


        // Remote video/audio
        room.on(
            LivekitClient.RoomEvent.TrackSubscribed,
            (track) => {

                const element = track.attach();

                element.autoplay = true;
                element.playsInline = true;

                if (track.kind === "video") {

                    const oldVideo =
                        document.getElementById("liveVideo");

                    if (oldVideo) {

                        oldVideo.replaceWith(element);
                    }

                    element.id = "liveVideo";
                }

                console.log("Remote track received.");
            }
        );


        await room.connect(
            LIVEKIT_WS_URL,
            token
        );


        statusText.textContent =
            "🟢 LIVE — Watching";


    } catch (error) {

        console.error("Join Live error:", error);

        statusText.textContent = "Ready";

        alert(error.message);
    }

});


// --------------------------------------------------
// END LIVE
// --------------------------------------------------

endLive.addEventListener("click", async () => {

    try {

        if (room) {

            room.disconnect();

            room = null;
        }


        const video =
            document.getElementById("liveVideo");

        if (video) {

            video.srcObject = null;
        }


        statusText.textContent =
            "Live ended";


    } catch (error) {

        console.error(error);

        alert(error.message);
    }

});
// ==========================================
// REQUEST TO BROADCAST
// ==========================================

if (requestBroadcast) {

    requestBroadcast.addEventListener("click", async () => {

        broadcastRequestStatus.textContent =
            "Submitting request...";

        try {

            // Get currently logged-in user
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError || !user) {

                broadcastRequestStatus.textContent =
                    "Please log in first.";

                alert("Please log in before requesting to broadcast.");

                return;
            }


            // Check whether a request already exists
            const { data: existing, error: checkError } =
                await supabase
                    .from("live_broadcasters")
                    .select("approved")
                    .eq("user_id", user.id)
                    .maybeSingle();


            if (checkError) {
                throw checkError;
            }


            // Already approved
            if (existing?.approved === true) {

                broadcastRequestStatus.textContent =
                    "You are already approved to broadcast.";

                alert("You are already approved to broadcast.");

                return;
            }


            // Request already submitted
            if (existing) {

                broadcastRequestStatus.textContent =
                    "Your broadcast request is awaiting admin approval.";

                alert(
                    "Your request has already been submitted and is awaiting admin approval."
                );

                return;
            }


            // Create new request
            const { error: insertError } =
                await supabase
                    .from("live_broadcasters")
                    .insert({
                        user_id: user.id,
                        approved: false
                    });


            if (insertError) {
                throw insertError;
            }


            broadcastRequestStatus.textContent =
                "Request submitted. Please wait for admin approval.";

            alert(
                "Broadcast request submitted successfully! An admin must approve you before you can start a live broadcast."
            );


        } catch (error) {

            console.error(
                "Broadcast request error:",
                error
            );

            broadcastRequestStatus.textContent =
                "Request failed: " + error.message;

            alert(
                "Request failed: " + error.message
            );

        }

    });

                }
// ==========================================
// LIVE COMMENTS
// ==========================================

const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentsContainer = document.getElementById("comments");

const LIVE_ROOM_NAME = "prudence-live-main";


// --------------------------------------------------
// ESCAPE HTML
// --------------------------------------------------

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// --------------------------------------------------
// GET USER NAME
// --------------------------------------------------

async function getCommentUserName(userId) {

    const { data, error } = await supabase
        .from("profiles")
        .select("username, public_username")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return "Prudence User";
    }

    return (
        data?.public_username ||
        data?.username ||
        "Prudence User"
    );
}


// --------------------------------------------------
// RENDER ONE COMMENT
// --------------------------------------------------

async function renderComment(comment) {

    const username =
        await getCommentUserName(comment.user_id);

    const currentUser =
        await supabase.auth.getUser();

    const currentUserId =
        currentUser.data?.user?.id;

    const commentElement =
        document.createElement("div");

    commentElement.className = "live-comment";

    commentElement.dataset.commentId =
        comment.id;

    const date =
        new Date(comment.created_at)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

    commentElement.innerHTML = `
        <div class="comment-content">
            <strong>${escapeHTML(username)}</strong>

            <span class="comment-time">
                ${escapeHTML(date)}
            </span>

            <p>${escapeHTML(comment.message)}</p>
        </div>

        ${
            currentUserId === comment.user_id
            ? `
                <button
                    class="delete-comment"
                    data-id="${comment.id}">
                    🗑️
                </button>
            `
            : ""
        }
    `;

    commentsContainer.appendChild(commentElement);
}


// --------------------------------------------------
// LOAD EXISTING COMMENTS
// --------------------------------------------------

async function loadLiveComments() {

    commentsContainer.innerHTML =
        "<p>Loading comments...</p>";

    const { data, error } = await supabase
        .from("live_comments")
        .select("*")
        .eq("room_name", LIVE_ROOM_NAME)
        .order("created_at", {
            ascending: true
        });

    if (error) {

        console.error(
            "Load comments error:",
            error
        );

        commentsContainer.innerHTML =
            "<p>Unable to load comments.</p>";

        return;
    }

    commentsContainer.innerHTML = "";

    if (!data || data.length === 0) {

        commentsContainer.innerHTML =
            "<p id='noComments'>No comments yet.</p>";

        return;
    }

    for (const comment of data) {

        await renderComment(comment);
    }
}


// --------------------------------------------------
// SEND COMMENT
// --------------------------------------------------

if (commentForm) {

    commentForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const message =
                commentInput.value.trim();

            if (!message) {
                return;
            }

            if (message.length > 500) {

                alert(
                    "Comment cannot be longer than 500 characters."
                );

                return;
            }

            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError || !user) {

                alert(
                    "Please log in before commenting."
                );

                return;
            }

            const sendButton =
                commentForm.querySelector("button");

            sendButton.disabled = true;

            const { error } =
                await supabase
                    .from("live_comments")
                    .insert({
                        user_id: user.id,
                        room_name: LIVE_ROOM_NAME,
                        message: message
                    });

            sendButton.disabled = false;

            if (error) {

                console.error(
                    "Send comment error:",
                    error
                );

                alert(
                    "Could not send comment: " +
                    error.message
                );

                return;
            }

            commentInput.value = "";
        }
    );
}


// --------------------------------------------------
// DELETE COMMENT
// --------------------------------------------------

if (commentsContainer) {

    commentsContainer.addEventListener(
        "click",
        async (event) => {

            const button =
                event.target.closest(
                    ".delete-comment"
                );

            if (!button) {
                return;
            }

            const commentId =
                button.dataset.id;

            if (!commentId) {
                return;
            }

            const confirmed =
                confirm(
                    "Delete this comment?"
                );

            if (!confirmed) {
                return;
            }

            const { error } =
                await supabase
                    .from("live_comments")
                    .delete()
                    .eq("id", commentId);

            if (error) {

                console.error(
                    "Delete comment error:",
                    error
                );

                alert(
                    "Could not delete comment: " +
                    error.message
                );

                return;
            }

            const element =
                document.querySelector(
                    `[data-comment-id="${commentId}"]`
                );

            if (element) {
                element.remove();
            }

            if (
                commentsContainer.children.length === 0
            ) {

                commentsContainer.innerHTML =
                    "<p id='noComments'>No comments yet.</p>";
            }
        }
    );
}


// --------------------------------------------------
// REALTIME COMMENTS
// --------------------------------------------------

const commentsChannel =
    supabase
        .channel("live-comments-channel")

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "live_comments",
                filter:
                    `room_name=eq.${LIVE_ROOM_NAME}`
            },
            async (payload) => {

                console.log(
                    "New live comment:",
                    payload.new
                );

                const noComments =
                    document.getElementById(
                        "noComments"
                    );

                if (noComments) {
                    noComments.remove();
                }

                await renderComment(
                    payload.new
                );
            }
        )

        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "live_comments"
            },
            (payload) => {

                const element =
                    document.querySelector(
                        `[data-comment-id="${payload.old.id}"]`
                    );

                if (element) {
                    element.remove();
                }
            }
        )

        .subscribe();


// --------------------------------------------------
// INITIAL LOAD
// --------------------------------------------------

loadLiveComments();
