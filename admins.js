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

const adminsContainer =
    document.getElementById("adminsContainer");

const searchAdmin =
    document.getElementById("searchAdmin");


let currentUser = null;
let currentProfile = null;
let admins = [];


/* =========================
   GET CURRENT USER
========================= */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return null;
    }

    return data.user || null;
}


/* =========================
   LOAD CURRENT PROFILE
========================= */

async function loadCurrentProfile(user) {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "id, username, email, role, status"
        )
        .eq(
            "id",
            user.id
        )
        .single();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        throw new Error(
            "Unable to load your profile."
        );
    }


    if (!data) {

        throw new Error(
            "Your profile was not found."
        );
    }


    if (data.role !== "superadmin") {

        throw new Error(
            "Access denied. Only Super Admins can manage administrators."
        );
    }


    if (
        data.status &&
        data.status !== "active"
    ) {

        throw new Error(
            "Your Super Admin account is not active."
        );
    }


    currentProfile = data;

    return data;
}


/* =========================
   LOAD ADMINISTRATORS
========================= */

async function loadAdmins() {

    adminsContainer.innerHTML =
        "<p>Loading administrators...</p>";


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(
            "id, username, email, role, status, created_at"
        )
        .in(
            "role",
            [
                "admin",
                "newsroom",
                "superadmin"
            ]
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "LOAD ADMINS ERROR:",
            error
        );


        adminsContainer.innerHTML = `

            <div class="error-message">

                <strong>
                    Unable to load administrators.
                </strong>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

        return;
    }


    admins = data || [];

    displayAdmins(admins);
}


/* =========================
   DISPLAY ADMINS
========================= */

function displayAdmins(list) {

    adminsContainer.innerHTML = "";


    if (
        !list ||
        list.length === 0
    ) {

        adminsContainer.innerHTML = `

            <div class="empty-message">

                <h3>
                    No administrators found.
                </h3>

                <p>
                    Add an existing Prudence 2 user
                    as an administrator.
                </p>

            </div>

        `;

        return;
    }


    list.forEach(
        admin => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "admin-card";


            const name =
                escapeHtml(
                    admin.username ||
                    "No Name"
                );


            const email =
                escapeHtml(
                    admin.email ||
                    "No Email"
                );


            const role =
                escapeHtml(
                    admin.role ||
                    "unknown"
                );


            const status =
                escapeHtml(
                    admin.status ||
                    "active"
                );


            const isCurrentUser =
                currentUser &&
                admin.id === currentUser.id;


            card.innerHTML = `

                <h3>
                    ${name}
                </h3>

                <p>
                    <strong>
                        Email:
                    </strong>

                    ${email}
                </p>

                <p>
                    <strong>
                        Role:
                    </strong>

                    <span class="admin-role">
                        ${role.toUpperCase()}
                    </span>
                </p>

                <p>
                    <strong>
                        Status:
                    </strong>

                    ${status}
                </p>

                <div class="buttons">

                    <button
                        type="button"
                        class="promote"
                    >
                        CHANGE ROLE
                    </button>

                    <button
                        type="button"
                        class="remove"
                        ${isCurrentUser ? "disabled" : ""}
                    >
                        REMOVE
                    </button>

                </div>

            `;


            const promoteButton =
                card.querySelector(
                    ".promote"
                );


            const removeButton =
                card.querySelector(
                    ".remove"
                );


            promoteButton.onclick =
                () => changeRole(admin);


            if (!isCurrentUser) {

                removeButton.onclick =
                    () => removeAdmin(admin);

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

async function changeRole(admin) {

    if (
        currentUser &&
        admin.id === currentUser.id
    ) {

        alert(
            "You cannot change your own Super Admin role."
        );

        return;
    }


    const newRole =
        prompt(
            "Enter the new role:\n\nadmin\nnewsroom\nsuperadmin",
            admin.role
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
            `Change ${admin.email}'s role to ${role}?`
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabase
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
            "Unable to change role:\n" +
            error.message
        );

        return;
    }


    await logActivity(
        `Changed ${admin.email} role to ${role}`
    );


    alert(
        "Administrator role updated successfully."
    );


    await loadAdmins();
}


/* =========================
   REMOVE ADMIN
========================= */

async function removeAdmin(admin) {

    if (
        currentUser &&
        admin.id === currentUser.id
    ) {

        alert(
            "You cannot remove your own Super Admin account."
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
    } = await supabase
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
            "Unable to remove administrator:\n" +
            error.message
        );

        return;
    }


    await logActivity(
        `Removed administrator privileges from ${admin.email}`
    );


    alert(
        "Administrator removed successfully."
    );


    await loadAdmins();
}


/* =========================
   ADD ADMIN
========================= */

addAdminButton.addEventListener(
    "click",
    async () => {

        const email =
            adminEmail.value
                .trim()
                .toLowerCase();


        const role =
            adminRole.value;


        if (!email) {

            alert(
                "Enter the user's email address."
            );

            return;
        }


        if (
            ![
                "admin",
                "newsroom",
                "superadmin"
            ].includes(role)
        ) {

            alert(
                "Invalid administrator role."
            );

            return;
        }


        addAdminButton.disabled =
            true;

        addAdminButton.textContent =
            "ADDING...";


        try {

            /*
             * The user must already have
             * a Prudence 2 profile.
             */

            const {
                data: userProfile,
                error: findError
            } = await supabase
                .from("profiles")
                .select(
                    "id, username, email, role, status"
                )
                .eq(
                    "email",
                    email
                )
                .maybeSingle();


            if (findError) {

                throw findError;
            }


            if (!userProfile) {

                alert(
                    "No Prudence 2 user was found with that email address."
                );

                return;
            }


            if (
                userProfile.role !== "user"
            ) {

                alert(
                    "This user is already an administrator."
                );

                return;
            }


            const {
                error: updateError
            } = await supabase
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


            await logActivity(
                `Added ${email} as ${role}`
            );


            alert(
                `${email} is now a ${role}.`
            );


            adminEmail.value =
                "";


            adminRole.value =
                "admin";


            await loadAdmins();

        }

        catch (error) {

            console.error(
                "ADD ADMIN ERROR:",
                error
            );


            alert(
                "Unable to add administrator:\n" +
                error.message
            );

        }

        finally {

            addAdminButton.disabled =
                false;

            addAdminButton.textContent =
                "ADD ADMIN";

        }

    }
);


/* =========================
   SEARCH
========================= */

searchAdmin.addEventListener(
    "input",
    () => {

        const keyword =
            searchAdmin.value
                .trim()
                .toLowerCase();


        if (!keyword) {

            displayAdmins(admins);

            return;
        }


        const filtered =
            admins.filter(
                admin => {

                    const name =
                        (
                            admin.username ||
                            ""
                        ).toLowerCase();


                    const email =
                        (
                            admin.email ||
                            ""
                        ).toLowerCase();


                    return (
                        name.includes(keyword) ||
                        email.includes(keyword)
                    );

                }
            );


        displayAdmins(filtered);

    }
);


/* =========================
   ACTIVITY LOG
========================= */

async function logActivity(
    action
) {

    try {

        /*
         * Only attempt this if the
         * adminLogs table exists.
         */

        const {
            error
        } = await supabase
            .from("admin_logs")
            .insert({
                action: action,
                performed_by: currentUser.id
            });


        if (error) {

            console.warn(
                "Activity log unavailable:",
                error.message
            );

        }

    }

    catch (error) {

        console.warn(
            "Activity log error:",
            error
        );

    }
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


/* =========================
   BACK BUTTON
========================= */

const backButton =
    document.querySelector(
        ".back-button"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


/* =========================
   START
========================= */

(async function () {

    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;
        }


        await loadCurrentProfile(
            currentUser
        );


        await loadAdmins();

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
            "../login.html";

    }

})();
