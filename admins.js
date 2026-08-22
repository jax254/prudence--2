import supabase from "./supabase.js";

const adminEmail = document.getElementById("adminEmail");
const adminRole = document.getElementById("adminRole");
const addAdminButton = document.getElementById("addAdmin");

const adminsContainer =
    document.getElementById("adminsContainer");

const searchAdmin =
    document.getElementById("searchAdmin");

let administrators = [];


/* =========================
   GET CURRENT USER
========================= */

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error) {

        console.error("AUTH ERROR:", error);

        throw new Error(
            "Unable to verify your login."
        );

    }

    if (!data.user) {

        window.location.href =
            "../login.html";

        return null;

    }

    return data.user;

}


/* =========================
   CHECK SUPERADMIN
========================= */

async function checkSuperAdmin(user) {

    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .select(`
            id,
            username,
            email,
            role,
            status
        `)
        .eq("id", user.id)
        .maybeSingle();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        throw new Error(
            "Unable to check administrator permissions.\n" +
            error.message
        );

    }


    if (!profile) {

        throw new Error(
            "Your profile could not be found."
        );

    }


    if (profile.role !== "superadmin") {

        throw new Error(
            "Access denied. Only Super Admins can manage administrators."
        );

    }


    if (
        profile.status &&
        profile.status !== "active"
    ) {

        throw new Error(
            "Your Super Admin account is not active."
        );

    }


    return profile;

}


/* =========================
   LOAD ADMINISTRATORS
========================= */

async function loadAdministrators() {

    adminsContainer.innerHTML =
        "<p>Loading administrators...</p>";


    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            id,
            username,
            email,
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
            "LOAD ADMINS ERROR:",
            error
        );

        adminsContainer.innerHTML = `
            <p style="color:red;">
                Unable to load administrators.
            </p>

            <p>
                ${escapeHtml(error.message)}
            </p>
        `;

        return;

    }


    administrators = data || [];

    displayAdministrators(
        administrators
    );

}


/* =========================
   DISPLAY ADMINISTRATORS
========================= */

function displayAdministrators(list) {

    adminsContainer.innerHTML = "";


    if (!list.length) {

        adminsContainer.innerHTML = `
            <p>
                No administrators found.
            </p>
        `;

        return;

    }


    list.forEach(admin => {

        const card =
            document.createElement("div");

        card.className =
            "admin-card";


        const name =
            escapeHtml(
                admin.username ||
                "Unnamed Administrator"
            );

        const email =
            escapeHtml(
                admin.email ||
                "No email"
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


        card.innerHTML = `

            <h3>
                ${name}
            </h3>

            <p>
                <strong>Email:</strong>
                ${email}
            </p>

            <p>
                <strong>Role:</strong>
                ${role}
            </p>

            <p>
                <strong>Status:</strong>
                ${status}
            </p>

            <div class="buttons">

                ${
                    admin.role !== "superadmin"
                    ?
                    `
                    <button
                        class="promote"
                        type="button"
                    >
                        CHANGE ROLE
                    </button>

                    <button
                        class="remove"
                        type="button"
                    >
                        REMOVE ADMIN
                    </button>
                    `
                    :
                    `
                    <strong>
                        🛡️ SUPER ADMIN
                    </strong>
                    `
                }

            </div>

        `;


        const changeButton =
            card.querySelector(
                ".promote"
            );


        if (changeButton) {

            changeButton.onclick =
            async function () {

                await changeRole(
                    admin
                );

            };

        }


        const removeButton =
            card.querySelector(
                ".remove"
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

    });

}


/* =========================
   ADD ADMIN
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

            alert(
                "Please enter the user's email address."
            );

            adminEmail.focus();

            return;

        }


        if (
            ![
                "admin",
                "newsroom"
            ].includes(role)
        ) {

            alert(
                "Please select a valid administrator role."
            );

            return;

        }


        addAdminButton.disabled =
            true;

        addAdminButton.textContent =
            "ADDING...";


        try {

            /*
             * Find existing Prudence 2 user.
             */

            const {
                data: user,
                error: findError
            } = await supabase
                .from("profiles")
                .select(`
                    id,
                    username,
                    email,
                    role,
                    status
                `)
                .ilike(
                    "email",
                    email
                )
                .maybeSingle();


            if (findError) {

                console.error(
                    "FIND USER ERROR:",
                    findError
                );

                throw new Error(
                    findError.message
                );

            }


            if (!user) {

                throw new Error(
                    "No Prudence 2 user was found with this email address."
                );

            }


            /*
             * Prevent accidentally changing
             * another Super Admin.
             */

            if (
                user.role === "superadmin"
            ) {

                throw new Error(
                    "This user is already a Super Admin."
                );

            }


            /*
             * Update administrator role.
             */

            const {
                error: updateError
            } = await supabase
                .from("profiles")
                .update({
                    role: role,
                    status: "active"
                })
                .eq(
                    "id",
                    user.id
                );


            if (updateError) {

                console.error(
                    "UPDATE ADMIN ERROR:",
                    updateError
                );

                throw new Error(
                    updateError.message
                );

            }


            alert(
                "✅ Administrator added successfully."
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


            alert(
                "❌ Could not add administrator.\n\n" +
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
   CHANGE ROLE
========================= */

async function changeRole(admin) {

    const newRole =
        prompt(
            "Enter new role:\n\nadmin\nnewsroom",
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
            "newsroom"
        ].includes(role)
    ) {

        alert(
            "Invalid role."
        );

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
            "CHANGE ROLE ERROR:",
            error
        );

        alert(
            "Could not change role.\n\n" +
            error.message
        );

        return;

    }


    alert(
        "✅ Role changed successfully."
    );


    await loadAdministrators();

}


/* =========================
   REMOVE ADMIN
========================= */

async function removeAdmin(admin) {

    const confirmed =
        confirm(
            "Remove administrator privileges from:\n\n" +
            admin.email +
            "\n\nThey will become a normal user."
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
            "Could not remove administrator.\n\n" +
            error.message
        );

        return;

    }


    alert(
        "✅ Administrator privileges removed."
    );


    await loadAdministrators();

}


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


        displayAdministrators(
            filtered
        );

    }
);


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
   BACK BUTTON
========================= */

const backButton =
    document.querySelector(
        ".back-button"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "admin-dashboard.html";

        }
    );

}


/* =========================
   START
========================= */

(async function () {

    try {

        const user =
            await getCurrentUser();


        if (!user) {

            return;

        }


        await checkSuperAdmin(
            user
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
            "admin-dashboard.html";

    }

})();
