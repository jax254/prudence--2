import supabase from "./supabase.js";


/* =====================================================
   ELEMENTS
===================================================== */

const adminEmail =
    document.getElementById("adminEmail");

const adminRole =
    document.getElementById("adminRole");

const addAdmin =
    document.getElementById("addAdmin");

const adminMessage =
    document.getElementById("adminMessage");

const adminsContainer =
    document.getElementById("adminsContainer");

const adminTemplate =
    document.getElementById("adminTemplate");

const searchAdmin =
    document.getElementById("searchAdmin");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let administrators = [];


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    message,
    type = "info"
) {

    adminMessage.textContent =
        message;

    adminMessage.className =
        "message " + type;

}


/* =====================================================
   GET CURRENT USER
===================================================== */

async function getCurrentUser() {

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return null;

    }


    return data.user || null;

}


/* =====================================================
   CHECK SUPERADMIN
===================================================== */

async function checkSuperadmin(
    user
) {

    const {
        data: profile,
        error
    } =
    await supabase
        .from("profiles")
        .select(
            "id, username, email, role, status"
        )
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        throw new Error(
            "Unable to verify your administrator account."
        );

    }


    if (!profile) {

        throw new Error(
            "Your profile was not found."
        );

    }


    if (
        profile.role !==
        "superadmin"
    ) {

        throw new Error(
            "Access denied. Only Super Admin can manage administrators."
        );

    }


    if (
        profile.status &&
        profile.status !== "active"
    ) {

        throw new Error(
            "Your account is not active."
        );

    }


    return profile;

}


/* =====================================================
   LOAD ADMINISTRATORS
===================================================== */

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
            username,
            email,
            role,
            status,
            created_at
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
            "ADMIN LIST ERROR:",
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


    displayAdministrators(
        administrators
    );

}


/* =====================================================
   DISPLAY ADMINISTRATORS
===================================================== */

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
                adminTemplate
                    .content
                    .cloneNode(true);


            const name =
                card.querySelector(
                    ".name"
                );


            const email =
                card.querySelector(
                    ".email"
                );


            const role =
                card.querySelector(
                    ".role"
                );


            const status =
                card.querySelector(
                    ".status"
                );


            const promoteButton =
                card.querySelector(
                    ".promote"
                );


            const removeButton =
                card.querySelector(
                    ".remove"
                );


            name.textContent =
                admin.username ||
                "No username";


            email.textContent =
                admin.email ||
                "No email";


            role.textContent =
                "Role: " +
                formatRole(
                    admin.role
                );


            status.textContent =
                "Status: " +
                (
                    admin.status ||
                    "active"
                );


            /*
                Prevent the superadmin
                from accidentally removing
                themselves.
            */

            if (
                admin.id ===
                currentUser.id
            ) {

                promoteButton.disabled =
                    true;

                removeButton.disabled =
                    true;

                status.textContent +=
                    " • YOU";

            }


            /* =========================
               CHANGE ROLE
            ========================== */

            promoteButton.onclick =
            async function () {

                await changeRole(
                    admin
                );

            };


            /* =========================
               REMOVE ADMIN
            ========================== */

            removeButton.onclick =
            async function () {

                await removeAdmin(
                    admin
                );

            };


            adminsContainer.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   CHANGE ROLE
===================================================== */

async function changeRole(
    admin
) {

    if (
        admin.id ===
        currentUser.id
    ) {

        alert(
            "You cannot change your own role."
        );

        return;

    }


    const newRole =
        prompt(
            "Enter the new role:\n\n" +
            "admin\n" +
            "newsroom\n" +
            "superadmin"
        );


    if (!newRole) {

        return;

    }


    const role =
        newRole
            .trim()
            .toLowerCase();


    if (
        ![
            "admin",
            "newsroom",
            "superadmin"
        ].includes(role)
    ) {

        alert(
            "Invalid role."
        );

        return;

    }


    const confirmed =
        confirm(
            "Change " +
            (admin.email || "this user") +
            " to " +
            role +
            "?"
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
            role: role
        })
        .eq(
            "id",
            admin.id
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


    await logAdminAction(
        "Changed " +
        (admin.email || admin.id) +
        " role to " +
        role
    );


    alert(
        "Role changed successfully."
    );


    await loadAdministrators();

}


/* =====================================================
   REMOVE ADMIN
===================================================== */

async function removeAdmin(
    admin
) {

    if (
        admin.id ===
        currentUser.id
    ) {

        alert(
            "You cannot remove yourself."
        );

        return;

    }


    const confirmed =
        confirm(
            "Remove administrator privileges from:\n\n" +
            (admin.email || admin.id) +
            "?"
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
            role: "user"
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


    await logAdminAction(
        "Removed administrator privileges from " +
        (admin.email || admin.id)
    );


    alert(
        "Administrator removed successfully."
    );


    await loadAdministrators();

}


/* =====================================================
   ADD ADMIN
===================================================== */

addAdmin.addEventListener(
    "click",
    async function () {

        const email =
            adminEmail.value
                .trim()
                .toLowerCase();


        const role =
            adminRole.value;


        if (!email) {

            showMessage(
                "Enter the user's email address.",
                "error"
            );

            return;

        }


        addAdmin.disabled =
            true;


        showMessage(
            "Searching for user...",
            "info"
        );


        try {

            /*
                Find an existing
                Prudence 2 profile.
            */

            const {
                data: userProfile,
                error
            } =
            await supabase
                .from("profiles")
                .select(
                    "id, username, email, role, status"
                )
                .eq(
                    "email",
                    email
                )
                .maybeSingle();


            if (error) {

                throw error;

            }


            if (!userProfile) {

                showMessage(
                    "No Prudence 2 user was found with that email.",
                    "error"
                );

                return;

            }


            if (
                userProfile.id ===
                currentUser.id
            ) {

                showMessage(
                    "You are already a Super Admin.",
                    "error"
                );

                return;

            }


            const confirmed =
                confirm(
                    "Make " +
                    (
                        userProfile.username ||
                        userProfile.email
                    ) +
                    " a " +
                    formatRole(role) +
                    "?"
                );


            if (!confirmed) {

                return;

            }


            const {
                error: updateError
            } =
            await supabase
                .from("profiles")
                .update({
                    role: role
                })
                .eq(
                    "id",
                    userProfile.id
                );


            if (updateError) {

                throw updateError;

            }


            await logAdminAction(
                "Added " +
                userProfile.email +
                " as " +
                role
            );


            showMessage(
                "Administrator added successfully.",
                "success"
            );


            adminEmail.value =
                "";


            adminRole.value =
                "admin";


            await loadAdministrators();

        }

        catch (error) {

            console.error(
                "ADD ADMIN ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Unable to add administrator.",
                "error"
            );

        }

        finally {

            addAdmin.disabled =
                false;

        }

    }
);


/* =====================================================
   SEARCH
===================================================== */

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

                    const username =
                        (
                            admin.username ||
                            ""
                        ).toLowerCase();


                    const email =
                        (
                            admin.email ||
                            ""
                        ).toLowerCase();


                    const role =
                        (
                            admin.role ||
                            ""
                        ).toLowerCase();


                    return (
                        username.includes(
                            keyword
                        ) ||
                        email.includes(
                            keyword
                        ) ||
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


/* =====================================================
   ADMIN ACTIVITY LOG
===================================================== */

async function logAdminAction(
    action
) {

    const {
        error
    } =
    await supabase
        .from("admin_logs")
        .insert({
            action: action,
            performed_by:
                currentUser.id
        });


    if (error) {

        console.error(
            "ADMIN LOG ERROR:",
            error
        );

    }

}


/* =====================================================
   FORMAT ROLE
===================================================== */

function formatRole(
    role
) {

    if (
        role ===
        "superadmin"
    ) {

        return "Super Admin";

    }


    if (
        role ===
        "newsroom"
    ) {

        return "Newsroom Admin";

    }


    if (
        role ===
        "admin"
    ) {

        return "Administrator";

    }


    return role || "User";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;

}


/* =====================================================
   START
===================================================== */

(async function () {

    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;

        }


        await checkSuperadmin(
            currentUser
        );


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
            "../dashboard.html";

    }

})();
