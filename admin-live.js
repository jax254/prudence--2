import supabase from "./supabase.js";

const requestsContainer =
  document.getElementById("requestsContainer");

const statusText =
  document.getElementById("status");

const refreshBtn =
  document.getElementById("refreshBtn");

const backBtn =
  document.getElementById("backBtn");


async function checkAdmin() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return null;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError) {
    console.error(profileError);
    alert("Could not verify your admin account.");
    return null;
  }

  if (
    profile.role !== "admin" &&
    profile.role !== "superadmin"
  ) {
    alert("You do not have permission to access this page.");
    window.location.href = "dashboard.html";
    return null;
  }

  return user;
}


async function loadRequests() {
  const user = await checkAdmin();

  if (!user) return;

  statusText.textContent = "Loading requests...";
  requestsContainer.innerHTML = "";

  const {
    data: requests,
    error
  } = await supabase
    .from("live_broadcasters")
    .select(`
      id,
      user_id,
      approved,
      approved_at,
      approved_by,
      created_at,
      profiles (
        username,
        public_username,
        prudence_id,
        email,
        admission_number
      )
    `)
    .eq("approved", false)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Load requests error:", error);

    statusText.textContent =
      "❌ Failed to load requests: " +
      error.message;

    return;
  }

  if (!requests || requests.length === 0) {
    statusText.textContent =
      "✅ No pending broadcast requests.";

    return;
  }

  statusText.textContent =
    `⏳ ${requests.length} pending broadcast request(s)`;

  requests.forEach(request => {
    const profile = request.profiles;

    const username =
      profile?.public_username ||
      profile?.username ||
      "Unknown User";

    const prudenceId =
      profile?.prudence_id ||
      "Not available";

    const admission =
      profile?.admission_number ||
      "Not available";

    const email =
      profile?.email ||
      "Not available";

    const date = request.created_at
      ? new Date(request.created_at)
          .toLocaleString()
      : "Unknown";

    const card =
      document.createElement("div");

    card.className = "request-card";

    card.innerHTML = `
      <h3>📡 ${username}</h3>

      <p class="request-info">
        <strong>Prudence ID:</strong>
        ${prudenceId}
      </p>

      <p class="request-info">
        <strong>Admission Number:</strong>
        ${admission}
      </p>

      <p class="request-info">
        <strong>Email:</strong>
        ${email}
      </p>

      <p class="request-info">
        <strong>Requested:</strong>
        ${date}
      </p>

      <div class="actions">

        <button
          class="approve-btn"
          data-id="${request.id}"
        >
          ✅ Approve
        </button>

        <button
          class="reject-btn"
          data-id="${request.id}"
        >
          ❌ Reject
        </button>

      </div>
    `;

    requestsContainer.appendChild(card);
  });

  document
    .querySelectorAll(".approve-btn")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => approveRequest(button.dataset.id)
      );
    });

  document
    .querySelectorAll(".reject-btn")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => rejectRequest(button.dataset.id)
      );
    });
}


async function approveRequest(requestId) {

  const user = await checkAdmin();

  if (!user) return;

  const confirmed = confirm(
    "Approve this user for live broadcasting?"
  );

  if (!confirmed) return;

  const {
    error
  } = await supabase
    .from("live_broadcasters")
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq("id", requestId);

  if (error) {
    console.error(error);

    alert(
      "Approval failed: " +
      error.message
    );

    return;
  }

  alert(
    "✅ User approved for live broadcasting."
  );

  loadRequests();
}


async function rejectRequest(requestId) {

  const user = await checkAdmin();

  if (!user) return;

  const confirmed = confirm(
    "Reject this broadcast request?"
  );

  if (!confirmed) return;

  /*
   * For now, rejection means the request
   * remains unapproved.
   *
   * We will add a proper rejected status
   * and rejection notification later.
   */

  const {
    error
  } = await supabase
    .from("live_broadcasters")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error(error);

    alert(
      "Rejection failed: " +
      error.message
    );

    return;
  }

  alert(
    "❌ Broadcast request rejected."
  );

  loadRequests();
}


refreshBtn.addEventListener(
  "click",
  loadRequests
);


backBtn.addEventListener(
  "click",
  () => {
    window.location.href =
      "admin-dashboard.html";
  }
);


loadRequests();
