import supabase from "./supabase.js";

console.log("Prudence 2 live.js loaded");

const startLive = document.getElementById("startLive");
const joinLive = document.getElementById("joinLive");
const endLive = document.getElementById("endLive");

const statusText = document.getElementById("status");
const liveVideo = document.getElementById("liveVideo");

let room = null;

const SUPABASE_FUNCTION_URL =
    "https://mreqwrdkucggwvxvturl.supabase.co/functions/v1/livekit-token";

const LIVEKIT_WS_URL =
    "wss://prudence-2-live-00bm3cbr.livekit.cloud

    ";


// --------------------------------------------------
// GET LIVEKIT TOKEN
// --------------------------------------------------

async function getLiveKitToken(mode) {

    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
        throw new Error(sessionError.message);
    }

    if (!session) {
        throw new Error("Please log in first.");
    }

    const user = session.user;

    const participantName =
        user.user_metadata?.username ||
        user.email ||
        "Prudence User";

    const participantIdentity = user.id;

    const response = await fetch(
        SUPABASE_FUNCTION_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },

            body: JSON.stringify({
                roomName: "prudence-live-test",
                participantName: participantName,
                participantIdentity: participantIdentity,
                mode: mode
            })
        }
    );

    const data = await response.json();

    console.log("Token function response:", data);

    if (!response.ok) {
        throw new Error(
            data.error || "Token function failed"
        );
    }

    if (!data.token) {
        throw new Error("No LiveKit token received.");
    }

    return data.token;
}


// --------------------------------------------------
// START LIVE
// --------------------------------------------------

startLive.addEventListener("click", async () => {

    statusText.textContent = "Checking broadcast approval...";

    try {

        const token = await getLiveKitToken("broadcaster");

        console.log("Broadcaster token received.");

        statusText.textContent =
            "Broadcast approved. Connecting...";

        room = new LivekitClient.Room();

        await room.connect(
            LIVEKIT_WS_URL,
            token
        );

        statusText.textContent =
            "🔴 LIVE — Broadcasting";

        console.log("Broadcaster connected.");

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        console.log("Camera and microphone enabled.");

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Broadcast unavailable";

        alert(error.message);
    }

});


// --------------------------------------------------
// JOIN LIVE
// --------------------------------------------------

joinLive.addEventListener("click", async () => {

    statusText.textContent =
        "Connecting to live broadcast...";

    try {

        const token = await getLiveKitToken("viewer");

        room = new LivekitClient.Room();

        room.on(
            LivekitClient.RoomEvent.TrackSubscribed,
            (track) => {

                if (track.kind === "video") {

                    const element =
                        track.attach();

                    liveVideo.srcObject =
                        element.srcObject;

                    liveVideo.play().catch(() => {});
                }

                if (track.kind === "audio") {

                    const element =
                        track.attach();

                    document.body.appendChild(element);
                }
            }
        );

        await room.connect(
            LIVEKIT_WS_URL,
            token
        );

        statusText.textContent =
            "🔴 LIVE — Watching";

        console.log("Viewer connected.");

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Unable to join live";

        alert(error.message);
    }

});


// --------------------------------------------------
// END LIVE
// --------------------------------------------------

endLive.addEventListener("click", async () => {

    if (room) {

        await room.disconnect();

        room = null;
    }

    liveVideo.srcObject = null;

    statusText.textContent =
        "Live ended";

    console.log("Live session ended.");

});
