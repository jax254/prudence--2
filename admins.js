import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const adminEmail =
    document.getElementById("adminEmail");

const adminRole =
    document.getElementById("adminRole");

const addAdminButton =
    document.getElementById("addAdmin");

const addStatus =
    document.getElementById("addStatus");

const adminsContainer =
    document.getElementById("adminsContainer");

const searchAdmin =
    document.getElementById("searchAdmin");

const adminTotal =
    document.getElementById("adminTotal");

const backButton =
    document.getElementById("backButton");


/* =========================
   STATE
========================= */

let currentUser = null;

let currentProfile = null;

let administrators = [];


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================
   STATUS MESSAGE
========================= */

function showStatus(
    message,
    type = "normal"
) {

    addStatus.textContent =
        message;

    addStatus.className =
        "status-message " + type;

}


/* =========================
   CHECK LOGIN
========================= */

async function checkLogin() {

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if (
        error ||
        !data.user
    ) {

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser =
        data.user;

    return true;

}


/* =========================
   LOAD CURRENT PROFILE
========================= */

async function loadCurrentProfile() {

    const {
        data,
        error
    } =
    await supabase

        .from("profiles")

        .select(`
            id,
            email,
            username,
            role,
            status
        `)

        .eq(
            "id",
            currentUser.id
        )

        .maybeSingle();


    if (error) {

        throw new Error(
            "Unable to load your profile: " +
            error.message
        );

    }


    if (!data) {

        throw new Error(
            "Your profile could not be found."
        );

    }


    currentProfile =
        data;


    /* ONLY SUPERADMIN */

    if (
        currentProfile.role !==
        "superadmin"
    ) {

        alert(
            "Access denied. Only the Superadmin can manage administrators."
        );

        window.location.href =
            "admin-dashboard.html";

        return false;

    }


    if (
        currentProfile.status &&
        currentProfile.status !==
        "active"
    ) {

        alert(
            "Your administrator account is not active."
        );

        window.location.href =
            "../login.html";

        return false;

    }


    return true;

}


/* =========================
   LOAD ADMINISTRATORS
========================= */

async function loadAdministrators() {

    adminsContainer.innerHTML = `

        <p class="loading">
            Loading administrators...
        </p>

    `;


    const {
        data,
        error
    } =
    await supabase

        .from("profiles")

        .select(`
            id,
            email,
            username,
            role,
            status
        `)

        .in(
            "role",
            [
                "admin",
                "newsroom",
                "superadmin"
            ]
        )

        .order(
            "username",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "ADMIN LOAD ERROR:",
            error
        );


        adminsContainer.innerHTML = `

            <div class="error-box">

                Unable to load administrators.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

        return;

    }


    administrators =
        data || [];


    adminTotal.textContent =
        administrators.length;


    displayAdministrators(
        administrators
    );

}


/* =========================
   DISPLAY ADMINISTRATORS
========================= */

function displayAdministrators(
    list
) {

    adminsContainer.innerHTML =
        "";


    if (
        list.length === 0
    ) {

        adminsContainer.innerHTML = `

            <div class="empty-box">

                No administrators found.

            </div>

        `;

        return;

    }


    list.forEach(
        admin => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "admin-card";


            const isSelf =
                admin.id ===
                currentUser.id;


            const isSuperadmin =
                admin.role ===
                "superadmin";


            const status =
                admin.status ||
                "active";


            card.innerHTML = `

                <div class="admin-info">

                    <div class="avatar">

                        ${
                            (
                                admin.username ||
                                admin.email ||
                                "A"
                            )
                            .charAt(0)
                            .toUpperCase()
                        }

                    </div>


                    <div class="details">

                        <h3>

                            ${escapeHtml(
                                admin.username ||
                                "Administrator"
                            )}

                        </h3>


                        <p class="email">

                            ${escapeHtml(
                                admin.email ||
                                "No email"
                            )}

                        </p>


                        <span class="
                            role-badge
                            ${escapeHtml(
                                admin.role
                            )}
                        ">

                            ${escapeHtml(
                                admin.role
                            )}

                        </span>


                        <span class="
                            status-badge
                            ${status === "active"
                                ? "active"
                                : "inactive"}
                        ">

                            ${escapeHtml(
                                status
                            )}

                        </span>

                    </div>

                </div>


                <div class="admin-actions">

                    ${
                        isSuperadmin

                        ?

                        `
                        <span class="protected">

                            🛡️ Superadmin

                        </span>
                        `

                        :

                        `

                        <button
                            class="role-button"
                            data-id="${admin.id}"
                            data-role="admin"
                            type="button"
                        >
                            Make Admin
                        </button>


                        <button
                            class="role-button newsroom-button"
                            data-id="${admin.id}"
                            data-role="newsroom"
                            type="button"
                        >
                            Make Newsroom
                        </button>


                        <button
                            class="remove-button"
                            data-id="${admin.id}"
                            type="button"
                        >
                            Remove Admin
                        </button>

                        `

                    }

                </div>

            `;


            /* =========================
               ROLE BUTTONS
            ========================= */

            card
                .querySelectorAll(
                    ".role-button"
                )
                .forEach(
                    button => {

                        button.onclick =
                        async function () {

                            const id =
                                button.dataset.id;

                            const role =
                                button.dataset.role;


                            await changeRole(
                                id,
                                role
                            );

                        };

                    }
                );


            /* =========================
               REMOVE BUTTON
            ========================= */

            const removeButton =
                card.querySelector(
                    ".remove-button"
                );


            if (removeButton) {

                removeButton.onclick =
                async function () {

                    await removeAdmin(
                        admin
                    );

                };

            }


            adminsContainer.appendChild(
                card
            );

        }
    );

}


/* =========================
   CHANGE ROLE
========================= */

async function changeRole(
    userId,
    newRole
) {

    if (
        ![
            "admin",
            "newsroom"
        ].includes(newRole)
    ) {

        return;

    }


    const target =
        administrators.find(
            admin =>
                admin.id ===
                userId
        );


    if (!target) {

        return;

    }


    if (
        target.role ===
        "superadmin"
    ) {

        alert(
            "The Superadmin account is protected."
        );

        return;

    }


    const confirmed =
        confirm(
            `Change ${target.email} to ${newRole}?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
    await supabase

        .from("profiles")

        .update({

            role:
                newRole,

            status:
                "active"

        })

        .eq(
            "id",
            userId
        );


    if (error) {

        console.error(
            "ROLE UPDATE ERROR:",
            error
        );


        alert(
            "Unable to change role:\n\n" +
            error.message
        );

        return;

    }


    alert(
        `Administrator role changed to ${newRole}.`
    );


    await loadAdministrators();

}


/* =========================
   REMOVE ADMIN
========================= */

async function removeAdmin(
    admin
) {

    if (
        admin.role ===
        "superadmin"
    ) {

        alert(
            "The Superadmin account cannot be removed from this panel."
        );

        return;

    }


    const confirmed =
        confirm(
            `Remove administrator privileges from ${admin.email}?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
    await supabase

        .from("profiles")

        .update({

            role:
                "user"

        })

        .eq(
            "id",
            admin.id
        );


    if (error) {

        console.error(
            "REMOVE ADMIN ERROR:",
            error
        );


        alert(
            "Unable to remove administrator:\n\n" +
            error.message
        );

        return;

    }


    alert(
        "Administrator privileges removed."
    );


    await loadAdministrators();

}


/* =========================
   ADD EXISTING USER
========================= */

addAdminButton.addEventListener(
    "click",
    async function () {

        const email =
            adminEmail.value
                .trim()
                .toLowerCase();


        const role =
            adminRole.value;


        if (!email) {

            showStatus(
                "Please enter an email address.",
                "error"
            );

            return;

        }


        if (
            ![
                "admin",
                "newsroom"
            ].includes(role)
        ) {

            showStatus(
                "Invalid administrator role.",
                "error"
            );

            return;

        }


        addAdminButton.disabled =
            true;


        addAdminButton.textContent =
            "Checking...";


        try {

            /*
             * Find an existing
             * Prudence 2 profile.
             */

            const {
                data: profile,
                error
            } =
            await supabase

                .from("profiles")

                .select(`
                    id,
                    email,
                    username,
                    role,
                    status
                `)

                .ilike(
                    "email",
                    email
                )

                .maybeSingle();


            if (error) {

                throw error;

            }


            if (!profile) {

                showStatus(
                    "No Prudence 2 user with that email was found. The person must create an account first.",
                    "error"
                );

                return;

            }


            if (
                profile.id ===
                currentUser.id
            ) {

                showStatus(
                    "You are already the Superadmin.",
                    "error"
                );

                return;

            }


            if (
                profile.role ===
                "superadmin"
            ) {

                showStatus(
                    "That account is already a Superadmin.",
                    "error"
                );

                return;

            }


            const {
                error:
                updateError
            } =
            await supabase

                .from("profiles")

                .update({

                    role:
                        role,

                    status:
                        "active"

                })

                .eq(
                    "id",
                    profile.id
                );


            if (updateError) {

                throw updateError;

            }


            showStatus(
                `${profile.email} is now a ${role}.`,
                "success"
            );


            adminEmail.value =
                "";


            await loadAdministrators();

        }

        catch (error) {

            console.error(
                "ADD ADMIN ERROR:",
                error
            );


            showStatus(
                "Unable to add administrator: " +
                error.message,
                "error"
            );

        }

        finally {

            addAdminButton.disabled =
                false;

            addAdminButton.textContent =
                "Add Administrator";

        }

    }
);


/* =========================
   SEARCH
========================= */

searchAdmin.addEventListener(
    "input",
    function () {

        const keyword =
            searchAdmin.value
                .trim()
                .toLowerCase();


        if (!keyword) {

            displayAdministrators(
                administrators
            );

            return;

        }


        const filtered =
            administrators.filter(
                admin => {

                    const name =
                        (
                            admin.username ||
                            ""
                        )
                        .toLowerCase();


                    const email =
                        (
                            admin.email ||
                            ""
                        )
                        .toLowerCase();


                    const role =
                        (
                            admin.role ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        name.includes(
                            keyword
                        )

                        ||

                        email.includes(
                            keyword
                        )

                        ||

                        role.includes(
                            keyword
                        )
                    );

                }
            );


        displayAdministrators(
            filtered
        );

    }
);


/* =========================
   BACK
========================= */

backButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "admin-dashboard.html";

    }
);


/* =========================
   START
========================= */

(async function () {

    try {

        const loggedIn =
            await checkLogin();


        if (!loggedIn) {

            return;

        }


        const authorized =
            await loadCurrentProfile();


        if (!authorized) {

            return;

        }


        await loadAdministrators();

    }

    catch (error) {

        console.error(
            "ADMIN MANAGEMENT ERROR:",
            error
        );


        alert(
            error.message
        );


        window.location.href =
            "admin-dashboard.html";

    }

})();
