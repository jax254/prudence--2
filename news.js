 import supabase from "./supabase.js"; 

const newsContainer = document.getElementById("newsContainer");
const newsTemplate = document.getElementById("newsTemplate"); 

// 1. Fetch data once on load
async function loadNews() {
try {
const { data, error } = await supabase
.from("news")
.select("*")
.eq("approved", true)
.order("created_at", { ascending: false }); 

if (error) throw error;

newsContainer.innerHTML = "";

if (!data || data.length === 0) {
    newsContainer.innerHTML = "<p>No news available.   }// Save Handlingif (saveBtn) {saveBtn.addEventListener("click", () => {alert("Saved feature will be completed in the profile module.");});}// Subscribe Handlingif (subscribeBtn) {subscribeBtn.addEventListener("click", () => {alert("You have subscribed to Christian News.");});}// Web Share API handlingif (shareBtn) {shareBtn.addEventListener("click", async () => {if (navigator.share) {try {await navigator.share({title: news.title,text: news.content,url: window.location.href});} catch (err) {if (err.name !== "AbortError") console.error(err);}} else {try {await navigator.clipboard.writeText(window.location.href);alert("Link copied.");} catch (err) {console.error(err);}}});}newsContainer.appendChild(card);}// InitializeloadNews();                                            window.location.href
                    
