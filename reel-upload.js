import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const videoFile =
    document.getElementById("videoFile");

const videoPreview =
    document.getElementById("videoPreview");

const videoPreviewContainer =
    document.getElementById(
        "videoPreviewContainer"
    );

const caption =
    document.getElementById("caption");

const uploadButton =
    document.getElementById(
        "uploadButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );

const progressContainer =
    document.getElementById(
        "progressContainer"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const progressText =
    document.getElementById(
        "progressText"
    );


let currentUser = null;

let selectedVideo = null;


/* =========================
   STATUS
========================= */

function showStatus(
    message,
    type = ""
){

    statusMessage.textContent =
        message;

    statusMessage.className =
        "status-message " +
        type;

}


/* =========================
   LOGIN
========================= */

async function checkLogin(){

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if(error){

        console.error(
            "AUTH ERROR:",
            error
        );

        showStatus(
            "Unable to verify your account.",
            "status-error"
        );

        return false;

    }


    if(!data.user){

        window.location.href =
            "login.html";

        return false;

    }


    currentUser =
        data.user;


    return true;

}


/* =========================
   VIDEO SELECTION
========================= */

videoFile.addEventListener(
    "change",
    () => {

        const file =
            videoFile.files[0];


        if(!file){

            selectedVideo =
                null;

            videoPreviewContainer.style.display =
                "none";

            return;

        }


        /*
         * Basic file validation.
         */

        if(
            !file.type.startsWith(
                "video/"
            )
        ){

            showStatus(
                "Please select a video file.",
                "status-error"
            );

            videoFile.value =
                "";

            return;

        }


        /*
         * Maximum size:
         * 100 MB
         */

        const maxSize =
            100 * 1024 * 1024;


        if(
            file.size > maxSize
        ){

            showStatus(
                "Video is too large. Maximum size is 100 MB.",
                "status-error"
            );

            videoFile.value =
                "";

            return;

        }


        selectedVideo =
            file;


        /*
         * Create local preview.
         */

        const videoURL =
            URL.createObjectURL(
                file
            );


        videoPreview.src =
            videoURL;


        videoPreviewContainer.style.display =
            "block";


        showStatus(
            "Video selected.",
            "status-success"
        );

    }
);


/* =========================
   UPLOAD
========================= */

uploadButton.addEventListener(
    "click",
    async () => {

        if(!currentUser){

            showStatus(
                "Please log in first.",
                "status-error"
            );

            return;

        }


        if(!selectedVideo){

            showStatus(
                "Please choose a video first.",
                "status-error"
            );

            return;

        }


        const captionText =
            caption.value.trim();


        uploadButton.disabled =
            true;


        uploadButton.textContent =
            "Uploading...";


        progressContainer.style.display =
            "block";


        progressBar.style.width =
            "10%";


        progressText.textContent =
            "Preparing video...";


        try{

            /*
             * Create a unique file name.
             */

            const extension =
                selectedVideo.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${currentUser.id}/${crypto.randomUUID()}.${extension}`;


            progressBar.style.width =
                "25%";


            progressText.textContent =
                "Uploading video...";


            /*
             * Upload to Supabase Storage.
             */

            const {
                error:
                    uploadError
            } =
            await supabase.storage
                .from("reels")
                .upload(
                    fileName,
                    selectedVideo,
                    {
                        cacheControl:"3600",
                        upsert:false,
                        contentType:
                            selectedVideo.type
                    }
                );


            if(uploadError){

                throw uploadError;

            }


            progressBar.style.width =
                "70%";


            progressText.textContent =
                "Creating Reel...";


            /*
             * Get public video URL.
             */

            const {
                data:
                    publicData
            } =
            supabase.storage
                .from("reels")
                .getPublicUrl(
                    fileName
                );


            const videoURL =
                publicData.publicUrl;


            /*
             * Save Reel in database.
             */

            const {
                error:
                    insertError
            } =
            await supabase
                .from("reels")
                .insert({

                    user_id:
                        currentUser.id,

                    video_url:
                        videoURL,

                    caption:
                        captionText,

                    status:
                        "published"

                });


            if(insertError){

                /*
                 * If database insertion
                 * fails, remove the uploaded
                 * file so we don't leave
                 * an orphaned video.
                 */

                await supabase.storage
                    .from("reels")
                    .remove([
                        fileName
                    ]);

                throw insertError;

            }


            progressBar.style.width =
                "100%";


            progressText.textContent =
                "Reel published successfully!";


            showStatus(
                "🎉 Your Christian Reel has been published!",
                "status-success"
            );


            /*
             * Reset form.
             */

            videoFile.value =
                "";

            caption.value =
                "";

            selectedVideo =
                null;


            videoPreview.pause();

            videoPreview.removeAttribute(
                "src"
            );

            videoPreview.load();


            setTimeout(
                () => {

                    window.location.href =
                        "reels.html";

                },
                1500
            );


        }
        catch(error){

            console.error(
                "REEL UPLOAD ERROR:",
                error
            );


            showStatus(
                "Upload failed: " +
                error.message,
                "status-error"
            );


            progressText.textContent =
                "Upload failed.";

        }


        uploadButton.disabled =
            false;


        uploadButton.textContent =
            "⬆️ Publish Reel";

    }
);


/* =========================
   BACK
========================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "reels.html";

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

})();
