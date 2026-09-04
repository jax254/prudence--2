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
      status,
      approved_at,
      approved_by,
      created_at
    `)
    .eq("status", "pending")
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

  // Get the profiles separately
  const userIds = requests.map(
    request => request.user_id
  );

  const {
    data: profiles,
    error: profilesError
  } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      public_username,
      prudence_id,
      email,
      admission_number
    `)
    .in("id", userIds);

  if (profilesError) {
    console.error(
      "Profiles loading error:",
      profilesError
    );

    statusText.textContent =
      "❌ Could not load user profiles: " +
      profilesError.message;

    return;
  }

  const profileMap = {};

  (profiles || []).forEach(profile => {
    profileMap[profile.id] = profile;
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

  const admin = await checkAdmin();

  if (!admin) return;

  const confirmed = confirm(
    "Approve this user for live broadcasting?"
  );

  if (!confirmed) return;

  const {
    data: request,
    error: requestError
  } = await supabase
    .from("live_broadcasters")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    console.error(requestError);

    alert(
      "Could not find the broadcast request."
    );

    return;
  }

  const {
    error: updateError
  } = await supabase
    .from("live_broadcasters")
    .update({
      approved: true,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: admin.id
    })
    .eq("id", requestId);

  if (updateError) {
    console.error(updateError);

    alert(
      "Approval failed: " +
      updateError.message
    );

    return;
  }

  const {
    error: notificationError
  } = await supabase
    .from("notifications")
    .insert({
      user_id: request.user_id,
      title: "📡 Broadcast Request Approved",
      message:
        "Your request to broadcast live on Prudence 2 has been approved. You can now start a live broadcast.",
      type: "live_approval",
      is_read: false
    });

  if (notificationError) {
    console.error(
      "Notification error:",
      notificationError
    );

    alert(
      "User approved, but the notification could not be sent."
    );
  } else {
    alert(
      "✅ User approved and notification sent."
    );
  }

  loadRequests();
}


async function rejectRequest(requestId) {

  const admin = await checkAdmin();

  if (!admin) return;

  const confirmed = confirm(
    "Reject this broadcast request?"
  );

  if (!confirmed) return;

  const {
    data: request,
    error: requestError
  } = await supabase
    .from("live_broadcasters")
    .select("user_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    console.error(requestError);

    alert(
      "Could not find the broadcast request."
    );

    return;
  }

  const {
    error: updateError
  } = await supabase
    .from("live_broadcasters")
    .update({
      approved: false,
      status: "rejected",
      approved_at: null,
      approved_by: null
    })
    .eq("id", requestId);

  if (updateError) {
    console.error(updateError);

    alert(
      "Rejection failed: " +
      updateError.message
    );

    return;
  }

  const {
    error: notificationError
  } = await supabase
    .from("notifications")
    .insert({
      user_id: request.user_id,
      title: "❌ Broadcast Request Rejected",
      message:
        "Your request to broadcast live on Prudence 2 was not approved at this time.",
      type: "live_rejection",
      is_read: false
    });

  if (notificationError) {
    console.error(
      "Notification error:",
      notificationError
    );

    alert(
      "Request rejected, but the notification could not be sent."
    );
  } else {
    alert(
      "❌ Request rejected and notification sent."
    );
  }

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
