// Check that JavaScript is loading
console.log("Prudence 2 live.js loaded");

const startLive = document.getElementById("startLive");
const joinLive = document.getElementById("joinLive");
const endLive = document.getElementById("endLive");

const statusText = document.getElementById("status");

let room = null;


// START LIVE
startLive.addEventListener("click", async () => {

    console.log("Start Live clicked");

    statusText.textContent = "Connecting...";

    try {

        const response = await fetch(
            "YOUR_SUPABASE_FUNCTION_URL",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    roomName: "prudence-live-test",
                    participantName: "Test User",
                    participantIdentity: "test-user-001"
                })
            }
        );


        const data = await response.json();

        console.log("Function response:", data);


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


        statusText.textContent =
            "Token received successfully";


        console.log(
            "LiveKit token received successfully"
        );


    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Error: " + error.message;

        alert(error.message);

    }

});


// JOIN LIVE
joinLive.addEventListener("click", () => {

    statusText.textContent =
        "Join Live clicked";

});


// END LIVE
endLive.addEventListener("click", () => {

    statusText.textContent =
        "Live ended";

});
