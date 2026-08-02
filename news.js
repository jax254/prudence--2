import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    increment,
    serverTimestamp,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const newsContainer = document.getElementById("newsContainer");
const newsTemplate = document.getElementById("newsTemplate");

const newsQuery = query(
    collection(db, "news"),
    where("approved", "==", true),
    orderBy("createdAt", "desc")
);

onSnapshot(newsQuery, (snapshot) => {

    newsContainer.innerHTML = "";

    if (snapshot.empty) {

        newsContainer.innerHTML =
        "<p>No news available.</p>";

        return;

    }

    snapshot.forEach((document) => {

        const news = document.data();

        const card =
        newsTemplate.content.cloneNode(true);

        card.querySelector(".title").textContent =
        news.title;

        card.querySelector(".author").textContent =
        "Published by: " + (news.author || "News Room");

        card.querySelector(".content").textContent =
        news.content;

        const image =
        card.querySelector(".image");

        if(news.image){

            image.src = news.image;

        }else{

            image.style.display="none";

        }

        // Like Button
        card.querySelector(".likeBtn")
        .addEventListener("click", async()=>{

            await updateDoc(
                doc(db,"news",document.id),
                {
                    likes:increment(1)
                }
            );

            alert("You liked this news.");

        });

        // Comment Button
        card.querySelector(".commentBtn")
        .addEventListener("click", async()=>{

            const text =
            prompt("Write your comment");

            if(!text) return;

            await addDoc(

                collection(db,"newsComments"),

                {

                    newsId:document.id,

                    comment:text,

                    createdAt:serverTimestamp()

                }

            );

            alert("Comment posted.");

        });

        // Save Button
        card.querySelector(".saveBtn")
        .addEventListener("click", ()=>{

            alert(
            "Saved feature will be completed in the profile module."
            );

        });

        // Subscribe Button
        card.querySelector(".subscribeBtn")
        .addEventListener("click", ()=>{

            alert(
            "You have subscribed to Christian News."
            );

        });

        // Share Button
        card.querySelector(".shareBtn")
        .addEventListener("click", async()=>{

            if(navigator.share){

                await navigator.share({

                    title:news.title,

                    text:news.content,

                    url:window.location.href

                });

            }else{

                navigator.clipboard.writeText(
                    window.location.href
                );

                alert("Link copied.");

            }

        });

        newsContainer.appendChild(card);

    });

});
