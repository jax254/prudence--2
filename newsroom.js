import supabase from "./supabase.js";

const form = document.getElementById("newsForm");
const myArticles = document.getElementById("myArticles");
const template = document.getElementById("articleTemplate");

const imageFile = document.getElementById("imageFile");
const videoFile = document.getElementById("videoFile");

const saveDraftButton = document.getElementById("saveDraft");
const submitNewsButton = document.getElementById("submitNews");

const uploadStatus = document.getElementById("uploadStatus");

let currentUser = null;
let editingId = null;
let editingImage = null;
let editingVideo = null;


// =========================
// CHECK LOGIN
// =========================

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {

        window.location.href = "../login.html";

        return false;
    }

    currentUser = user;

    return true;
}


// =========================
// CHECK NEWSROOM ACCESS
// =========================

async function checkAccess() {

    const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (error) {

        console.error(error);

        alert("Unable to verify your account role.");

        return false;
    }

    const role = data?.role;

    if (
        role !== "newsroom" &&
        role !== "admin" &&
        role !== "superadmin"
    ) {

        alert("Access denied.");

        window.location.href = "../dashboard.html";

        return false;
    }

    return true;
}


// =========================
// UPLOAD MEDIA
// =========================

async function uploadMedia(file, folder) {

    if (!file) return null;


    uploadStatus.textContent =
        "Uploading " + folder + "...";


    const fileExtension =
        file.name.split(".").pop();


    const safeName =
        file.name
            .replace(/[^a-zA-Z0-9.-]/g, "_");


    const filePath =
        currentUser.id +
        "/" +
        folder +
        "/" +
        Date.now() +
        "_" +
        safeName;


    const { error } = await supabase
        .storage
        .from("news-media")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false
            }
        );


    if (error) {

        console.error(
            "MEDIA UPLOAD ERROR:",
            error
        );

        throw error;
    }


    const { data } =
        supabase
            .storage
            .from("news-media")
            .getPublicUrl(filePath);


    uploadStatus.textContent =
        "Upload complete.";

    return data.publicUrl;
}


// =========================
// SAVE ARTICLE
// =========================

async function saveArticle(status) {

    if (!currentUser) {

        const loggedIn =
            await checkUser();

        if (!loggedIn) return;
    }


    const title =
        document.getElementById("title")
            .value
            .trim();


    const content =
        document.getElementById("content")
            .value
            .trim();


    if (!title || !content) {

        alert(
            "Please enter a news title and article content."
        );

        return;
    }


    try {

        uploadStatus.textContent =
            "Preparing article...";


        let imageURL = editingImage;
        let videoURL = editingVideo;


        // Upload new image

        if (imageFile.files.length > 0) {

            imageURL =
                await uploadMedia(
                    imageFile.files[0],
                    "images"
                );
        }


        // Upload new video

        if (videoFile.files.length > 0) {

            videoURL =
                await uploadMedia(
                    videoFile.files[0],
                    "videos"
                );
        }


        // =========================
        // EDIT EXISTING ARTICLE
        // =========================

        if (editingId) {

            const { error } =
                await supabase
                    .from("news")
                    .update({

                        title: title,

                        content: content,

                        image: imageURL,

                        video: videoURL,

                        status: status,

                        approved:
                            status === "Approved"

                    })
                    .eq(
                        "id",
                        editingId
                    )
                    .eq(
                        "uid",
                        currentUser.id
                    );


            if (error) {

                console.error(error);

                alert(
                    "Unable to update article: " +
                    error.message
                );

                return;
            }


            alert(
                status === "Draft"
                    ? "Draft updated successfully."
                    : "Article updated and submitted for approval."
            );

        }


        // =========================
        // CREATE NEW ARTICLE
        // =========================

        else {

            const { error } =
                await supabase
                    .from("news")
                    .insert({

                        title: title,

                        content: content,

                        image: imageURL,

                        video: videoURL,

                        author:
                            currentUser.email,

                        uid:
                            currentUser.id,

                        approved: false,

                        status: status,

                        likes: 0

                    });


            if (error) {

                console.error(
                    "NEWS INSERT ERROR:",
                    error
                );

                alert(
                    "Unable to save article: " +
                    error.message
                );

                return;
            }


            alert(
                status === "Draft"
                    ? "Draft saved successfully."
                    : "News submitted successfully for approval."
            );

        }


        // Reset editor

        resetEditor();

        await loadArticles();

    }

    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Something went wrong."
        );

    }

}


// =========================
// SAVE DRAFT
// =========================

saveDraftButton.addEventListener(
    "click",
    async () => {

        await saveArticle("Draft");

    }
);


// =========================
// SUBMIT FOR APPROVAL
// =========================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        await saveArticle(
            "Pending Approval"
        );

    }
);


// =========================
// LOAD MY ARTICLES
// =========================

async function loadArticles() {

    if (!currentUser) return;


    const { data, error } =
        await supabase
            .from("news")
            .select("*")
            .eq(
                "uid",
                currentUser.id
            )
            .order(
                "Created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "LOAD ARTICLES ERROR:",
            error
        );

        myArticles.innerHTML =
            "<p>Unable to load your articles.</p>";

        return;
    }


    myArticles.innerHTML = "";


    if (!data || data.length === 0) {

        myArticles.innerHTML =
            "<p>No articles yet.</p>";

        return;
    }


    data.forEach((news) => {

        const card =
            template.content.cloneNode(true);


        // Title

        card.querySelector(
            ".articleTitle"
        ).textContent =
            news.title ||
            "Untitled";


        // Status

        card.querySelector(
            ".articleStatus"
        ).textContent =
            news.status ||
            "Draft";


        // Date

        card.querySelector(
            ".articleDate"
        ).textContent =
            news.Created_at
                ? new Date(
                    news.Created_at
                ).toLocaleString()
                : "Just now";


        // =========================
        // EDIT
        // =========================

        card.querySelector(
            ".editButton"
        ).addEventListener(
            "click",
            () => {

                startEditing(news);

            }
        );


        // =========================
        // DELETE
        // =========================

        card.querySelector(
            ".deleteButton"
        ).addEventListener(
            "click",
            async () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to delete this article?"
                    );


                if (!confirmed) return;


                const { error } =
                    await supabase
                        .from("news")
                        .delete()
                        .eq(
                            "id",
                            news.id
                        )
                        .eq(
                            "uid",
                            currentUser.id
                        );


                if (error) {

                    console.error(error);

                    alert(
                        "Unable to delete article: " +
                        error.message
                    );

                    return;
                }


                alert(
                    "Article deleted successfully."
                );


                loadArticles();

            }
        );


        myArticles.appendChild(card);

    });

}


// =========================
// START EDITING
// =========================

function startEditing(news) {

    editingId =
        news.id;

    editingImage =
        news.image || null;

    editingVideo =
        news.video || null;


    document.getElementById(
        "title"
    ).value =
        news.title || "";


    document.getElementById(
        "content"
    ).value =
        news.content || "";


    imageFile.value = "";

    videoFile.value = "";


    saveDraftButton.textContent =
        "💾 Update Draft";


    submitNewsButton.textContent =
        "📤 Update & Submit";


    uploadStatus.textContent =
        "Editing: " +
        (news.status || "Article");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================
// RESET EDITOR
// =========================

function resetEditor() {

    form.reset();

    editingId = null;

    editingImage = null;

    editingVideo = null;

    uploadStatus.textContent = "";


    saveDraftButton.textContent =
        "💾 Save Draft";


    submitNewsButton.textContent =
        "📤 Submit for Approval";

}


// =========================
// START
// =========================

(async () => {

    const loggedIn =
        await checkUser();

    if (!loggedIn) return;


    const allowed =
        await checkAccess();

    if (!allowed) return;


    await loadArticles();

})();
                        
                                        
                                
