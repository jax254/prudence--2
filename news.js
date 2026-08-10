 import supabase from "./supabase.js";

const newsContainer = document.getElementById("newsContainer");
const newsTemplate = document.getElementById("newsTemplate");

// 1. Centralized Event Handler (Event Delegation)
newsContainer.addEventListener("click", async (event) => {
    const target = event.target;
    const card = target.closest("[data-id]");
    if (!card) return;

    const newsId = card.dataset.id;
    const title = card.dataset.title;
    const content = card.dataset.content;

    // Handle Like Button
    if (target.matches(".likeBtn")) {
        handleLike(card, newsId);
    }

    // Handle Comment Button
    if (target.matches(".commentBtn")) {
        handleComment(newsId);
    }

    // Handle Save Button
    if (target.matches(".saveBtn")) {
        alert("Saved feature will be completed in the profile module.");
    }

    // Handle Subscribe Button
    if (target.matches(".subscribeBtn")) {
        alert("You have subscribed to Christian News.");
    }

    // Handle Share Button
    if (target.matches(".shareBtn")) {
        handleShare(title, content);
    }
});

// 2. Optimized Action Logic
async function handleLike(card, newsId) {
    const countElement = card.querySelector(".likeCount");
    const currentLikes = parseInt(countElement.textContent || 0, 10);
    
    // Optimistic Update: Change UI instantly
    countElement.textContent = currentLikes + 1;

    // Database Update using RPC to prevent race conditions
    // Note: Requires an RPC function named 'increment_likes' setup in Supabase
    const { error } = await supabase.rpc("increment_likes", { row_id: newsId });

    if (error) {
        console.error("Like failed:", error);
        countElement.textContent = currentLikes; // Revert on failure
        alert("Unable to like this news.");
    }
}

async function handleComment(newsId) {
    const text = prompt("Write your comment:");
    if (!text?.trim()) return;

    const { error } = await supabase
        .from("newsComments")
        .insert({ news_id: newsId, comment: text.trim() });

    if (error) {
        console.error("Comment failed:", error);
        alert("Unable to post comment.");
        return;
    }
    alert("Comment posted.");
}

async function handleShare(title, content) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text: content, url: window.location.href });
        } catch (err) {
            console.error("Share cancelled or failed", err);
        }
    } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard.");
    }
}

// 3. Main Data Loader
async function loadNews() {
    const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("News error:", error);
        newsContainer.innerHTML = "<p>Unable to load news.</p>";
        return;
    }

    newsContainer.innerHTML = "";

    if (!data || data.length === 0) {
        newsContainer.innerHTML = "<p>No news available.</p>";
        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach((news) => {
        const instance = newsTemplate.content.cloneNode(true);
        const rootElement = instance.querySelector("*"); // Gets the outer wrapper of the template

        // Store metadata inside HTML attributes for event delegation
        rootElement.setAttribute("data-id", news.id);
        rootElement.setAttribute("data-title", news.title || "");
        rootElement.setAttribute("data-content", news.content || "");

        // Inject Content safely
        instance.querySelector(".title").textContent = news.title || "";
        instance.querySelector(".author").textContent = `Published by: ${news.author || "News Room"}`;
        instance.querySelector(".content").textContent = news.content || "";
        
        // Target an element to display the total counts visually
        const likeCountEl = instance.querySelector(".likeCount");
        if (likeCountEl) likeCountEl.textContent = news.likes || 0;

        const image = instance.querySelector(".image");
        if (news.image) {
            image.src = news.image;
            image.style.display = "block";
        } else {
            image.style.display = "none";
        }

        fragment.appendChild(instance);
    });

    newsContainer.appendChild(fragment);
}

loadNews();
