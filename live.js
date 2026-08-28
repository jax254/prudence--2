import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ===============================
// SUPABASE
// ===============================

const SUPABASE_URL = "YOUR_SUPABASE_URL";

const SUPABASE_PUBLISHABLE_KEY =
"YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ===============================
// LIVEKIT
// ===============================

const LIVEKIT_URL =
"wss://prudence-2-live-00bm3cbr.livekit.cloud

   ";


// ===============================
// ELEMENTS
// ===============================

const startLive =
document.getElementById("startLive");

const joinLive =
document.getElementById("joinLive");

const endLive =
document.getElementById("endLive");

const liveVideo =
document.getElementById("liveVideo");

const statusText =
document.getElementById("status");


// ===============================
// ROOM
// ===============================

let room = null;

let currentRoomName = null;

let isBroadcaster = false;


// ===============================
// GET USER
// ===============================

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


// ===============================
// GET LIVEKIT TOKEN
// ===============================

async function getLiveKitToken(
    roomName,
    participantName,
    participantIdentity
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
                participantIdentity

            }

        }
    );


    if (error) {

        console.error(error);

        throw new Error(
            "Unable to get LiveKit token."
        );

    }


    if (!data || !data.token) {

        throw new Error(
            "LiveKit token was not returned."
        );

    }


    return data.token;

}


// ===============================
// CONNECT TO ROOM
// ===============================

async function connectToRoom(
    roomName,
    publish
) {


    const user = await getCurrentUser();


    if (!user) return;


    const participantName =
        user.user_metadata?.full_name ||
        user.email ||
        "Prudence User";


    const participantIdentity =
        user.id;


    statusText.textContent =
        "Connecting...";


    const token =
        await getLiveKitToken(
            roomName,
            participantName,
            participantIdentity
        );


    room = new LivekitClient.Room({

        adaptiveStream: true,

        dynacast: true

    });


    room.on(
        LivekitClient.RoomEvent.TrackSubscribed,
        (track) => {

            if (
                track.kind ===
                LivekitClient.Track.Kind.Video
            ) {

                const element =
                    track.attach();

                element.autoplay = true;
                element.playsInline = true;

                document
                    .getElementById("videoContainer")
                    .appendChild(element);

            }


            if (
                track.kind ===
                LivekitClient.Track.Kind.Audio
            ) {

                const element =
                    track.attach();

                element.autoplay = true;

                document
                    .getElementById("videoContainer")
                    .appendChild(element);

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


    currentRoomName =
        roomName;


    statusText.textContent =
        publish
        ? "🔴 LIVE"
        : "Watching Live";


    // ===============================
    // BROADCASTER
    // ===============================

    if (publish) {

        isBroadcaster = true;


        await room
            .localParticipant
            .enableCameraAndMicrophone();


        const cameraPublication =
            room.localParticipant
                .getTrackPublication(
                    LivekitClient.Track.Source.Camera
                );


        if (
            cameraPublication &&
            cameraPublication.track
        ) {

            const element =
                cameraPublication.track.attach();

            element.autoplay = true;
            element.playsInline = true;
            element.muted = true;

            document
                .getElementById("videoContainer")
                .appendChild(element);

        }

    }

}


// ===============================
// START LIVE
// ===============================

startLive.addEventListener(
    "click",
    async () => {

        try {

            const user =
                await getCurrentUser();


            if (!user) return;


            const roomName =
                "prudence-live-" +
                user.id;


            await connectToRoom(
                roomName,
                true
            );


            startLive.disabled = true;
            joinLive.disabled = true;


        } catch (error) {

            console.error(error);

            statusText.textContent =
                "Live failed";

            alert(error.message);

        }

    }
);


// ===============================
// JOIN LIVE
// ===============================

joinLive.addEventListener(
    "click",
    async () => {

        try {

            const roomName =
                prompt(
                    "Enter the Live room name:"
                );


            if (!roomName) return;


            await connectToRoom(
                roomName,
                false
            );


            joinLive.disabled = true;
            startLive.disabled = true;


        } catch (error) {

            console.error(error);

            statusText.textContent =
                "Unable to join";

            alert(error.message);

        }

    }
);


// ===============================
// END LIVE
// ===============================

endLive.addEventListener(
    "click",
    async () => {

        if (!room) return;


        await room.disconnect();


        room = null;

        isBroadcaster = false;

        currentRoomName = null;


        statusText.textContent =
            "Live ended";


        startLive.disabled = false;
        joinLive.disabled = false;

    }
);
