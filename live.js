import supabase from "./supabase.js";
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


        room = new LiveKitClient.Room();


        // Listen for connection
        room.on(
            LiveKitClient.RoomEvent.Connected,
            () => {

                console.log("Broadcaster connected.");

                statusText.textContent = "LIVE — Broadcasting";
            }
        );


        // Local camera/microphone
        room.on(
            LiveKitClient.RoomEvent.LocalTrackPublished,
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
            await LiveKitClient.createLocalTracks({
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


        room = new LiveKitClient.Room();


        // Remote video/audio
        room.on(
            LiveKitClient.RoomEvent.TrackSubscribed,
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
