import supabase from "./supabase.js";


const form =
    document.getElementById("newsForm");

const titleInput =
    document.getElementById("title");

const contentEditor =
    document.getElementById("content");

const imageFile =
    document.getElementById("imageFile");

const videoFile =
    document.getElementById("videoFile");

const imagePreview =
    document.getElementById("imagePreview");

const videoPreview =
    document.getElementById("videoPreview");

const myArticles =
    document.getElementById("myArticles");

const template =
    document.getElementById("articleTemplate");

const editorHeading =
    document.getElementById("editorHeading");

const saveDraftButton =
    document.getElementById("saveDraft");

const cancelEditButton =
    document.getElementById("cancelEdit");

const linkButton =
    document.getElementById("linkButton");

const undoButton =
    document.getElementById("undoButton");

const redoButton =
    document.getElementById("redoButton");

const checkWritingBtn =
    document.getElementById("checkWritingBtn");

const writingResults =
    document.getElementById("writingResults");
let currentUser = null;

let editingArticleId = null;

let existingImage = null;

let existingVideo = null;


/* =========================
   CHECK LOGIN
========================= */

async function checkUser(){

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if(error || !user){

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser = user;

    return true;

}


/* =========================
   RICH TEXT TOOLS
========================= */

document
.querySelectorAll(".toolbar button[data-command]")
.forEach(button => {

    button.addEventListener("click", () => {

        const command =
            button.dataset.command;

        document.execCommand(
            command,
            false,
            null
        );

        contentEditor.focus();

    });

});


/* =========================
   LINK TOOL
========================= */

if(linkButton){

    linkButton.addEventListener(
    "click",
    () => {

        const url =
            prompt(
                "Enter the website link:"
            );

        if(!url) return;


        document.execCommand(
            "createLink",
            false,
            url
        );


        contentEditor.focus();

    });

}


/* =========================
   UNDO
========================= */

if(undoButton){

    undoButton.addEventListener(
    "click",
    () => {

        document.execCommand(
            "undo",
            false,
            null
        );

        contentEditor.focus();

    });

}


/* =========================
   REDO
========================= */

if(redoButton){

    redoButton.addEventListener(
    "click",
    () => {

        document.execCommand(
            "redo",
            false,
            null
        );

        contentEditor.focus();

    });

}


/* =========================
   IMAGE PREVIEW
========================= */

if(imageFile){

    imageFile.addEventListener(
    "change",
    () => {

        const file =
            imageFile.files[0];

        imagePreview.innerHTML = "";

        if(!file) return;


        const url =
            URL.createObjectURL(file);


        const img =
            document.createElement("img");

        img.src = url;

        img.style.maxWidth = "100%";

        img.style.borderRadius = "10px";


        imagePreview.appendChild(img);

    });

}


/* =========================
   VIDEO PREVIEW
========================= */

if(videoFile){

    videoFile.addEventListener(
    "change",
    () => {

        const file =
            videoFile.files[0];

        videoPreview.innerHTML = "";

        if(!file) return;


        const url =
            URL.createObjectURL(file);


        const video =
            document.createElement("video");

        video.src = url;

        video.controls = true;

        video.style.maxWidth = "100%";

        video.style.borderRadius = "10px";


        videoPreview.appendChild(video);

    });

}


/* =========================
   UPLOAD MEDIA
========================= */

async function uploadMedia(
    file,
    folder
){

    if(!file){

        return null;

    }


    const extension =
        file.name
        .split(".")
        .pop()
        .toLowerCase();


    const fileName =
        `${currentUser.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extension}`;


    const path =
        `${folder}/${fileName}`;


    const {
        error
    } = await supabase
        .storage
        .from("news-media")
        .upload(
            path,
            file,
            {
                upsert:false
            }
        );


    if(error){

        throw error;

    }


    const {
        data
    } =
    supabase
        .storage
        .from("news-media")
        .getPublicUrl(path);


    return data.publicUrl;

}

async function getAuthorName() {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {

        console.error(
            "AUTHOR PROFILE ERROR:",
            error
        );

        return "Prudence 2 User";

    }

    return (
        data?.username ||
        "Prudence 2 User"
    );

                                           }
/* =========================
   SAVE ARTICLE
========================= */

async function saveArticle(status){

    if(!currentUser){

        const loggedIn =
            await checkUser();

        if(!loggedIn) return;

    }


    const title =
        titleInput.value.trim();


    const content =
        contentEditor.innerHTML.trim();


    if(!title){

        alert(
            "Please enter a news title."
        );

        return;

    }


    if(!content){

        alert(
            "Please write the article."
        );

        return;

    }


    try{

        let imageURL =
            existingImage;

        let videoURL =
            existingVideo;


        /* =====================
           UPLOAD IMAGE
        ===================== */

        if(imageFile &&
           imageFile.files[0]){

            imageURL =
                await uploadMedia(
                    imageFile.files[0],
                    "images"
                );

        }


        /* =====================
           UPLOAD VIDEO
        ===================== */

        if(videoFile &&
           videoFile.files[0]){

            videoURL =
                await uploadMedia(
                    videoFile.files[0],
                    "videos"
                );

        }


        /* =====================
           EDIT EXISTING ARTICLE
        ===================== */

        if(editingArticleId){

            const {
                error
            } =
            await supabase
            .from("news")
            .update({

                title:title,

                content:content,

                image:imageURL,

                video:videoURL,

                status:status,

                approved:false

            })
            .eq(
                "id",
                editingArticleId
            )
            .eq(
                "uid",
                currentUser.id
            );


            if(error){

                throw error;

            }


            if(status === "Draft"){

                alert(
                    "Draft updated successfully."
                );

            }else{

                alert(
                    "Article updated and submitted for approval."
                );

            }

        }


        /* =====================
           CREATE NEW ARTICLE
        ===================== */

        else{

            const {
                error
            } =
            await supabase
            .from("news")
            .insert({

                title:title,

                content:content,

                image:imageURL,

                video:videoURL,

                author:
                  await getAuthorName(),

                uid:
                  currentUser.id,

                approved:false,

                status:status,

                likes:0

            });


            if(error){

                throw error;

            }


            if(status === "Draft"){

                alert(
                    "Draft saved successfully."
                );

            }else{

                alert(
                    "News submitted for approval."
                );

            }

        }


        resetEditor();

        await loadArticles();

    }


    catch(error){

        console.error(
            "NEWSROOM ERROR:",
            error
        );


        alert(
            "Unable to save article:\n" +
            error.message
        );

    }

}


/* =========================
   SAVE DRAFT
========================= */

if(saveDraftButton){

    saveDraftButton.addEventListener(
    "click",
    async () => {

        await saveArticle(
            "Draft"
        );

    });

}


/* =========================
   SUBMIT FOR APPROVAL
========================= */

form.addEventListener(
"submit",
async(e) => {

    e.preventDefault();

    await saveArticle(
        "Pending Approval"
    );

});


/* =========================
   LOAD ARTICLES
========================= */

async function loadArticles(){

    if(!currentUser) return;


    const {
        data,
        error
    } =
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
            ascending:false
        }
    );


    if(error){

        console.error(
            "LOAD ARTICLES ERROR:",
            error
        );


        myArticles.innerHTML =
            "<p>Unable to load your articles.</p>";

        return;

    }


    myArticles.innerHTML = "";


    if(!data ||
       data.length === 0){

        myArticles.innerHTML =
            "<p>No articles yet.</p>";

        return;

    }


    data.forEach(news => {

        const card =
            template.content
            .cloneNode(true);


        /* TITLE */

        card.querySelector(
            ".articleTitle"
        ).textContent =
            news.title ||
            "Untitled";


        /* STATUS */

        card.querySelector(
            ".articleStatus"
        ).textContent =
            news.status ||
            "Draft";


        /* DATE */

        card.querySelector(
            ".articleDate"
        ).textContent =
            news.Created_at
            ?
            new Date(
                news.Created_at
            ).toLocaleString()
            :
            "Just now";


        /* =====================
           EDIT
        ===================== */

        const editButton =
            card.querySelector(
                ".editButton"
            );


        if(editButton){

            editButton.addEventListener(
            "click",
            () => {

                editArticle(news);

            });

        }


        /* =====================
           DELETE
        ===================== */

        const deleteButton =
            card.querySelector(
                ".deleteButton"
            );


        if(deleteButton){

            deleteButton.addEventListener(
            "click",
            async() => {

                await deleteArticle(
                    news.id
                );

            });

        }


        myArticles.appendChild(card);

    });

}


/* =========================
   EDIT ARTICLE
========================= */

function editArticle(news){

    editingArticleId =
        news.id;


    existingImage =
        news.image || null;


    existingVideo =
        news.video || null;


    titleInput.value =
        news.title || "";


    contentEditor.innerHTML =
        news.content || "";


    editorHeading.textContent =
        "✏️ Edit Article";


    if(cancelEditButton){

        cancelEditButton.style.display =
            "block";

    }


    /* IMAGE */

    if(imagePreview){

        imagePreview.innerHTML =
            existingImage
            ?
            `<img
                src="${existingImage}"
                style="max-width:100%;border-radius:10px;"
            >`
            :
            "";

    }


    /* VIDEO */

    if(videoPreview){

        videoPreview.innerHTML =
            existingVideo
            ?
            `<video
                src="${existingVideo}"
                controls
                style="max-width:100%;border-radius:10px;"
            ></video>`
            :
            "";

    }


    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}


/* =========================
   DELETE ARTICLE
========================= */

async function deleteArticle(id){

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this article?"
        );


    if(!confirmDelete){

        return;

    }


    const {
        error
    } =
    await supabase
    .from("news")
    .delete()
    .eq(
        "id",
        id
    )
    .eq(
        "uid",
        currentUser.id
    );


    if(error){

        console.error(error);


        alert(
            "Unable to delete article:\n" +
            error.message
        );

        return;

    }


    alert(
        "Article deleted successfully."
    );


    await loadArticles();

}


/* =========================
   CANCEL EDIT
========================= */

if(cancelEditButton){

    cancelEditButton.addEventListener(
    "click",
    () => {

        resetEditor();

    });

}


/* =========================
   RESET EDITOR
========================= */

function resetEditor(){

    form.reset();


    contentEditor.innerHTML =
        "";


    if(imagePreview){

        imagePreview.innerHTML =
            "";

    }


    if(videoPreview){

        videoPreview.innerHTML =
            "";

    }


    editingArticleId =
        null;


    existingImage =
        null;


    existingVideo =
        null;


    editorHeading.textContent =
        "Write News Article";


    if(cancelEditButton){

        cancelEditButton.style.display =
            "none";

    }

}


/* =========================
   START
========================= */

(async() => {

    const loggedIn =
        await checkUser();


    if(!loggedIn) return;


    await loadArticles();

})();
    
