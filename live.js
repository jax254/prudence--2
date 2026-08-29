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

const ROOM_NAME =
    "prudence-live-test";


// ----------------------------------
// GET LIVEKIT TOKEN
// ----------------------------------

async function getToken(participantName, participantIdentity) {

    const response = await fetch(
        SUPABASE_FUNCTION_URL,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                roomName: ROOM_NAME,
                participantName: participantName,
                participantIdentity: participantIdentity
            })
        }
    );

    const data = await response.json();

    console.log("Token response:", data);

    if (!response.ok) {
        throw new Error(
            data.error || "Token function failed"
        );
    }

    if (!data.token) {
        throw new Error(
            "No LiveKit token received"
        );
    }

    return data.token;
}


// ----------------------------------
// DISPLAY LOCAL VIDEO
// ----------------------------------

function showLocalVideo(track) {

    const video = track.attach();

    video.id = "localLiveVideo";

    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    videoContainer.innerHTML = "";

    videoContainer.appendChild(video);
}


// ----------------------------------
// DISPLAY REMOTE VIDEO
// ----------------------------------

function showRemoteVideo(track, participant) {

    console.log(
        "Remote video from:",
        participant.identity
    );

    const video = track.attach();

    video.autoplay = true;
    video.playsInline = true;

    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    videoContainer.innerHTML = "";

    videoContainer.appendChild(video);
}


// ----------------------------------
// CONNECT TO LIVEKIT
// ----------------------------------

async function connectToLiveKit(token) {

    room = new LivekitClient.Room({
        adaptiveStream: true,
        dynacast: true
    });


    // Remote track arrives
    room.on(
        LivekitClient.RoomEvent.TrackSubscribed,
        (track, publication, participant) => {

            if (
                track.kind === LivekitClient.Track.Kind.Video ||
                track.kind === LivekitClient.Track.Kind.Audio
            ) {

                if (
                    track.kind ===
                    LivekitClient.Track.Kind.Video
                ) {

                    showRemoteVideo(
                        track,
                        participant
                    );

                } else {

                    const audio =
                        track.attach();

                    document.body.appendChild(audio);
                }
            }
        }
    );


    // Remote track removed
    room.on(
        LivekitClient.RoomEvent.TrackUnsubscribed,
        (track) => {

            track.detach();

        }
    );


    // Connection lost
    room.on(
        LivekitClient.RoomEvent.Disconnected,
        () => {

            console.log(
                "Disconnected from LiveKit"
            );

            statusText.textContent =
                "Disconnected";

        }
    );


    await room.connect(
        LIVEKIT_URL,
        token
    );


    console.log(
        "Connected to LiveKit room:",
        room.name
    );

}


// ----------------------------------
// START LIVE
// ----------------------------------

startLive.addEventListener(
    "click",
    async () => {

        try {

            startLive.disabled = true;

            statusText.textContent =
                "Getting LiveKit token...";


            const token =
                await getToken(
                    "Prudence Broadcaster",
                    "broadcaster-" +
                    Date.now()
                );


            statusText.textContent =
                "Connecting to Live..." ;


            await connectToLiveKit(token);


            statusText.textContent =
                "Connected — starting camera...";


            // Turn on camera
            const cameraPublication =
                await room.localParticipant
                    .setCameraEnabled(true);


            // Turn on microphone
            await room.localParticipant
                .setMicrophoneEnabled(true);


            if (
                cameraPublication &&
                cameraPublication.track
            ) {

                showLocalVideo(
                    cameraPublication.track
                );

            }


            statusText.textContent =
                "🔴 LIVE — Broadcasting";


            console.log(
                "Broadcast started successfully"
            );

        } catch (error) {

            console.error(
                "START LIVE ERROR:",
                error
            );

            statusText.textContent =
                "Error: " + error.message;

            alert(
                "Live failed: " +
                error.message
            );

            startLive.disabled = false;
        }

    }
);


// ----------------------------------
// JOIN LIVE
// ----------------------------------

joinLive.addEventListener(
    "click",
    async () => {

        try {

            joinLive.disabled = true;

            statusText.textContent =
                "Joining Live...";


            const token =
                await getToken(
                    "Prudence Viewer",
                    "viewer-" +
                    Date.now()
                );


            await connectToLiveKit(token);


            statusText.textContent =
                "Connected — watching Live";


            console.log(
                "Joined Live successfully"
            );

        } catch (error) {

            console.error(
                "JOIN LIVE ERROR:",
                error
            );

            statusText.textContent =
                "Error: " + error.message;

            alert(
                "Join Live failed: " +
                error.message
            );

            joinLive.disabled = false;
        }

    }
);


// ----------------------------------
// END LIVE
// ----------------------------------

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


            console.log(
                "Live ended"
            );

        } catch (error) {

            console.error(
                "END LIVE ERROR:",
                error
            );

        }

    }
);
