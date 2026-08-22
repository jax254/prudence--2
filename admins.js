import supabase from "./supabase.js";

/* =========================
   ELEMENTS
========================= */

const adminEmail =
    document.getElementById("adminEmail");

const adminRole =
    document.getElementById("adminRole");

const addAdmin =
    document.getElementById("addAdmin");

const adminsContainer =
    document.getElementById("adminsContainer");

const adminTemplate =
    document.getElementById("adminTemplate");

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


/* =========================
   GET CURRENT PROFILE
========================= */

async function getCurrentProfile(userId) {

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
            status
        `)
        .eq(
            "id",
            userId
        )
        .single();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        throw new Error(
            "Unable to load administrator profile."
        );

    }


    return data;

}


/* =========================
   SECURITY CHECK
========================= */

async function checkSuperadmin() {

    currentUser =
        await getCurrentUser();


    if (!currentUser) {

        location.href =
            "../login.html";

        return false;

    }


    currentProfile =
        await getCurrentProfile(
            currentUser.id
        );


    if (
        !currentProfile ||
        currentProfile.role !== "superadmin"
    ) {

        alert(
            "Access denied. Only the Superadmin can manage administrators."
        );

        location.href =
            "admin-dashboard.html";

        return false;

    }


    return true;

}


/* =========================
   LOAD ADMINS
========================= */

async function loadAdmins() {

    adminsContainer.innerHTML = `
        <p>Loading administrators...</p>
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
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "LOAD ADMINS ERROR:",
            error
        );


        adminsContainer.innerHTML = `
            <p>
                Unable to load administrators.
            </p>

            <p>
                ${escapeHtml(
                    error.message
                )}
            </p>
        `;

        return;

    }


    admins =
        data || [];


    displayAdmins(
        admins
    );

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
        value || "";

    return div.innerHTML;

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
            <p>
                No administrators found.
            </p>
        `;

        return;

    }


    list.forEach(
        admin => {

            const card =
                adminTemplate.content.cloneNode(
                    true
                );


            card.querySelector(
                ".name"
            ).textContent =
                admin.username ||
                "No Name";


            card.querySelector(
                ".email"
            ).textContent =
                admin.email ||
                "No email";


            card.querySelector(
                ".role"
            ).textContent =
                "Role: " +
                (
                    admin.role ||
                    "unknown"
                );


            const promoteButton =
                card.querySelector(
                    ".promote"
                );


            const demoteButton =
                card.querySelector(
                    ".demote"
                );


            const removeButton =
                card.querySelector(
                    ".remove"
                );


            /*
                NEVER allow the Superadmin
                to remove or demote itself.
            */

            if (
                admin.id ===
                currentUser.id
            ) {

                promoteButton.disabled =
                    true;

                demoteButton.disabled =
                    true;

                removeButton.disabled =
                    true;

                promoteButton.title =
                    "You cannot change your own Superadmin account.";

                demoteButton.title =
                    "You cannot change your own Superadmin account.";

                removeButton.title =
                    "You cannot remove your own Superadmin account.";

            }


            /* =========================
               PROMOTE / CHANGE ROLE
            ========================= */

            promoteButton.onclick =
            async function () {

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
                        "Enter new role:\n\nadmin\nnewsroom\nsuperadmin"
                    );


                if (!newRole)
                    return;


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


                if (
                    !confirm(
                        `Change ${admin.email} to ${role}?`
                    )
                ) {

                    return;

                }


                await changeRole(
                    admin.id,
                    admin.email,
                    role
                );

            };


            /* =========================
               DEMOTE
            ========================= */

            demoteButton.onclick =
            async function () {

                if (
                    admin.id ===
                    currentUser.id
                ) {

                    alert(
                        "You cannot demote your own account."
                    );

                    return;

                }


                if (
                    !confirm(
                        `Demote ${admin.email} to normal user?`
                    )
                ) {

                    return;

                }


                await changeRole(
                    admin.id,
                    admin.email,
                    "user"
                );

            };


            /* =========================
               REMOVE
            ========================= */

            removeButton.onclick =
            async function () {

                if (
                    admin.id ===
                    currentUser.id
                ) {

                    alert(
                        "You cannot remove your own account."
                    );

                    return;

                }


                if (
                    !confirm(
                        `Remove ${admin.email} from administrators?`
                    )
                ) {

                    return;

                }


                await changeRole(
                    admin.id,
                    admin.email,
                    "user"
                );

            };


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
    email,
    newRole
) {

    const {
        error
    } =
    await supabase
        .from("profiles")
        .update({
            role: newRole
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
            "Unable to change administrator role:\n\n" +
            error.message
        );

        return;

    }


    alert(
        `${email} is now ${newRole}.`
    );


    await loadAdmins();

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


                    const role =
                        (
                            admin.role ||
                            ""
                        ).toLowerCase();


                    return (
                        name.includes(
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


        displayAdmins(
            filtered
        );

    }
);


/* =========================
   ADMIN INVITATION
========================= */

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

            alert(
                "Enter the administrator email."
            );

            return;

        }


        if (
            ![
                "admin",
                "newsroom"
            ].includes(role)
        ) {

            alert(
                "New Superadmin accounts must be created by the existing Superadmin."
            );

            return;

        }


        /*
            For now we only prepare the
            invitation request.

            We will connect this to a
            secure Supabase Edge Function
            in the next step.
        */

        alert(
            "Invitation system is being secured. The invitation database will be connected next."
        );

    }
);


/* =========================
   START
========================= */

(async function () {

    try {

        const authorized =
            await checkSuperadmin();


        if (!authorized)
            return;


        await loadAdmins();

    }

    catch (error) {

        console.error(
            "ADMIN MANAGEMENT ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to open Admin Management."
        );


        location.href =
            "admin-dashboard.html";

    }

})();
