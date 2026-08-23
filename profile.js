import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const profileImage =
    document.getElementById("profileImage");

const imageInput =
    document.getElementById("imageInput");

const username =
    document.getElementById("username");

const admissionNumber =
    document.getElementById("admissionNumber");

const church =
    document.getElementById("church");

const bibleVerse =
    document.getElementById("bibleVerse");

const bio =
    document.getElementById("bio");

const saveProfile =
    document.getElementById("saveProfile");

const newsCount =
    document.getElementById("newsCount");

const prayerCount =
    document.getElementById("prayerCount");

const chatCount =
    document.getElementById("chatCount");


let currentUser = null;


/* =========================
   CHECK LOGIN
========================= */

async function checkLogin(){

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if(error || !data.user){

        window.location.href =
            "login.html";

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
            prudence_id,
            username,
            admission_number,
            university,
            church,
            bible_verse,
            bio,
            profile_photo
        `)

        .eq(
            "id",
            currentUser.id
        )

        .single();


    if(error){

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

        alert(
            "Unable to load your profile."
        );

        return;

    }


    username.value =
        data.username || "";

    admissionNumber.value =
        data.admission_number || "";

    church.value =
        data.church || "";

    bibleVerse.value =
        data.bible_verse || "";

    bio.value =
        data.bio || "";


    if(data.profile_photo){

        profileImage.src =
            data.profile_photo;

    }

}


/* =========================
   SAVE PROFILE
========================= */

saveProfile.addEventListener(
    "click",
    async () => {

        if(!currentUser){

            return;

        }


        saveProfile.disabled =
            true;

        saveProfile.textContent =
            "Saving...";


        try{

            let profilePhoto =
                null;


            /*
             * Upload profile picture
             * to Supabase Storage
             */

            const file =
                imageInput.files[0];


            if(file){

                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const fileName =
                    `${currentUser.id}/profile-${crypto.randomUUID()}.${extension}`;


                const {
                    error:
                        uploadError
                } =
                await supabase.storage

                    .from("profile-pictures")

                    .upload(
                        fileName,
                        file,
                        {
                            cacheControl:
                                "3600",

                            upsert:false,

                            contentType:
                                file.type
                        }
                    );


                if(uploadError){

                    throw uploadError;

                }


                const {
                    data:
                        publicData
                } =
                supabase.storage

                    .from(
                        "profile-pictures"
                    )

                    .getPublicUrl(
                        fileName
                    );


                profilePhoto =
                    publicData.publicUrl;


                profileImage.src =
                    profilePhoto;

            }


            /*
             * Update profile
             */

            const updateData = {

                username:
                    username.value.trim(),

                church:
                    church.value.trim(),

                bible_verse:
                    bibleVerse.value.trim(),

                bio:
                    bio.value.trim()

            };


            if(profilePhoto){

                updateData.profile_photo =
                    profilePhoto;

            }


            const {
                error
            } =
            await supabase

                .from("profiles")

                .update(
                    updateData
                )

                .eq(
                    "id",
                    currentUser.id
                );


            if(error){

                throw error;

            }


            alert(
                "Profile updated successfully."
            );


        }
        catch(error){

            console.error(
                "PROFILE UPDATE ERROR:",
                error
            );


            alert(
                "Unable to update your profile: " +
                error.message
            );

        }


        saveProfile.disabled =
            false;

        saveProfile.textContent =
            "Save Profile";

    }
);


/* =========================
   LOAD STATISTICS
========================= */

async function loadStatistics(){

    /*
     * News
     */

    const {
        count:
            newsTotal
    } =
    await supabase

        .from("news")

        .select(
            "*",
            {
                count:"exact",
                head:true
            }
        )

        .eq(
            "user_id",
            currentUser.id
        );


    newsCount.textContent =
        newsTotal || 0;


    /*
     * Prayer requests
     */

    const {
        count:
            prayerTotal
    } =
    await supabase

        .from("prayers")

        .select(
            "*",
            {
                count:"exact",
                head:true
            }
        )

        .eq(
            "user_id",
            currentUser.id
        );


    prayerCount.textContent =
        prayerTotal || 0;


    /*
     * General chat messages
     */

    const {
        count:
            chatTotal
    } =
    await supabase

        .from(
            "general_chat_messages"
        )

        .select(
            "*",
            {
                count:"exact",
                head:true
            }
        )

        .eq(
            "user_id",
            currentUser.id
        );


    chatCount.textContent =
        chatTotal || 0;

}


/* =========================
   START
========================= */

(async function(){

    const loggedIn =
        await checkLogin();


    if(!loggedIn){

        return;

    }


    await loadProfile();

    await loadStatistics();

})();
