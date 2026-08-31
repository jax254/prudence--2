import supabase from "./supabase.js";

console.log("Prudence 2 LiveKit started");

const startLive = document.getElementById("startLive");
const joinLive = document.getElementById("joinLive");
const endLive = document.getElementById("endLive");

const statusText = document.getElementById("status");
const videoContainer = document.getElementById("videoContainer");

let room = null;

const SUPABASE_FUNCTION_URL =
    "https://mreqwrdkucggwvxvturl.supabase.co/functions/v1/livekit-token";

const LIVEKIT_URL =
    "wss://prudence-2-live-00bm3cbr.livekit.cloud";


// ======================================
// GET LOGGED-IN USER
// ======================================

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error || !data.user) {

        window.location.href = "login.html";

        return null;
    }

    return data.user;
}


// ======================================
// GET PROFILE
// ======================================

async function getProfile(userId) {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("username, public_username")
        .eq("id", userId)
        .maybeSingle();

    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        return null;
    }

    return data;
}


// ======================================
// GET LIVEKIT TOKEN
// ======================================

async function getLiveKitToken(
    roomName,
    participantName,
    participantIdentity,
    mode
) {

    const {
        data,
        error
    } = await supabase.functions.invoke(
        "livekit-token",
        {
            body: {
                roomName,
                participantName,
                participantIdentity,
                mode
            }
        }
    );

    if (error) {

        console.error(
            "TOKEN ERROR:",
            error
        );

        throw new Error(
            error.message ||
            "Unable to get LiveKit token."
        );
    }

    if (!data || !data.token) {

        throw new Error(
            data?.error ||
            "No LiveKit token received."
        );
    }

    return data.token;
}


// ======================================
// SHOW VIDEO
// ======================================

function showVideo(track, muted = false) {

    const video =
        track.attach();

    video.autoplay = true;
    video.playsInline = true;
    video.muted = muted;

    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    videoContainer.innerHTML = "";

    videoContainer.appendChild(video);
}


// ======================================
// CONNECT TO LIVEKIT
// ======================================

async function connectToLiveKit(token) {

    room = new LivekitClient.Room({

        adaptiveStream: true,

        dynacast: true

    });


    // Remote video/audio
    room.on(
        LivekitClient.RoomEvent.TrackSubscribed,
        (
            track,
            publication,
            participant
        ) => {

            console.log(
                "Remote track:",
                participant.identity
            );

            if (
                track.kind ===
                LivekitClient.Track.Kind.Video
            ) {

                showVideo(
                    track,
                    false
                );

            }


            if (
                track.kind ===
                LivekitClient.Track.Kind.Audio
            ) {

                const audio =
                    track.attach();

                document.body.appendChild(
                    audio
                );
            }

        }
    );


    room.on(
        LivekitClient.RoomEvent.TrackUnsubscribed,
        (track) => {

            track.detach();

        }
    );


    room.on(
        LivekitClient.RoomEvent.Disconnected,
        () => {

            statusText.textContent =
                "Disconnected";

        }
    );


    await room.connect(
        LIVEKIT_URL,
        token
    );

}


// ======================================
// START LIVE
// ======================================

startLive.addEventListener(
    "click",
    async () => {

        try {

            startLive.disabled = true;

            statusText.textContent =
                "Checking account...";


            const user =
                await getCurrentUser();


            if (!user) return;


            const profile =
                await getProfile(
                    user.id
                );


            const participantName =
                profile?.public_username ||
                profile?.username ||
                user.email ||
                "Prudence User";


            const roomName =
                "prudence-live-main";


            statusText.textContent =
                "Checking broadcast approval...";


            const token =
                await getLiveKitToken(
                    roomName,
                    participantName,
                    user.id,
                    "broadcaster"
                );


            statusText.textContent =
                "Connecting to Live...";


            await connectToLiveKit(
                token
            );


            statusText.textContent =
                "Starting camera...";


            const publication =
                await room.localParticipant
                    .setCameraEnabled(true);


            await room.localParticipant
                .setMicrophoneEnabled(true);


            if (
                publication &&
                publication.track
            ) {

                showVideo(
                    publication.track,
                    true
                );

            }


            statusText.textContent =
                "🔴 LIVE — Broadcasting";


            console.log(
                "Broadcast started."
            );


        } catch (error) {

            console.error(
                "START LIVE ERROR:",
                error
            );


            statusText.textContent =
                "Unable to start Live";


            alert(
                error.message
            );


            startLive.disabled = false;

        }

    }
);


// ======================================
// JOIN LIVE
// ======================================

joinLive.addEventListener(
    "click",
    async () => {

        try {

            joinLive.disabled = true;

            statusText.textContent =
                "Checking account...";


            const user =
                await getCurrentUser();


            if (!user) return;


            const profile =
                await getProfile(
                    user.id
                );


            const participantName =
                profile?.public_username ||
                profile?.username ||
                user.email ||
                "Prudence Viewer";


            const roomName =
                "prudence-live-main";


            statusText.textContent =
                "Getting viewer access...";


            const token =
                await getLiveKitToken(
                    roomName,
                    participantName,
                    user.id,
                    "viewer"
                );


            statusText.textContent =
                "Joining Live...";


            await connectToLiveKit(
                token
            );


            statusText.textContent =
                "📺 Watching Live";


        } catch (error) {

            console.error(
                "JOIN LIVE ERROR:",
                error
            );


            statusText.textContent =
                "Unable to join Live";


            alert(
                error.message
            );


            joinLive.disabled = false;

        }

    }
);


// ======================================
// END LIVE
// ======================================

endLive.addEventListener(
    "click",
    async () => {

        try {

            if (room) {

                await room.disconnect();

                room = null;

            }


            videoContainer.innerHTML = "";


            statusText.textContent =
                "Live ended";


            startLive.disabled = false;
            joinLive.disabled = false;


        } catch (error) {

            console.error(
                "END LIVE ERROR:",
                error
            );

        }

    }
);
