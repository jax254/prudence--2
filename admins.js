import supabase from "./supabase.js";


/* =========================================================
   ELEMENTS
========================================================= */

const adminSearch =
    document.getElementById("adminSearch");

const searchResults =
    document.getElementById("searchResults");

const selectedUser =
    document.getElementById("selectedUser");

const selectedUserName =
    document.getElementById("selectedUserName");

const selectedUserEmail =
    document.getElementById("selectedUserEmail");

const adminRole =
    document.getElementById("adminRole");

const addAdmin =
    document.getElementById("addAdmin");

const adminsContainer =
    document.getElementById("adminsContainer");

const searchAdmin =
    document.getElementById("searchAdmin");

const adminTemplate =
    document.getElementById("adminTemplate");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let selectedProfile = null;

let administrators = [];


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================================================
   GET CURRENT USER
========================================================= */

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


/* =========================================================
   LOAD CURRENT PROFILE
========================================================= */

async function loadCurrentProfile() {

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
            currentUser.id
        )
        .maybeSingle();


    if (error) {

        throw new Error(
            "Unable to load your profile:\n" +
            error.message
        );

    }


    if (!data) {

        throw new Error(
            "Your profile was not found."
        );

    }


    currentProfile =
        data;


    if (
        currentProfile.role !==
        "superadmin"
    ) {

        throw new Error(
            "Access denied. Only the Superadmin can manage administrators."
        );

    }


    if (
        currentProfile.status &&
        currentProfile.status !==
        "active"
    ) {

        throw new Error(
            "Your Superadmin account is not active."
        );

    }

}


/* =========================================================
   LOAD ADMINISTRATORS
========================================================= */

async function loadAdministrators() {

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


    displayAdministrators(
        administrators
    );

}


/* =========================================================
   DISPLAY ADMINISTRATORS
========================================================= */

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


            card.querySelector(
                ".name"
            ).textContent =
                admin.username ||
                "No username";


            card.querySelector(
                ".email"
            ).textContent =
                admin.email ||
                "No email";


            card.querySelector(
                ".role"
            ).textContent =
                "Role: " +
                admin.role;


            card.querySelector(
                ".status"
            ).textContent =
                "Status: " +
                (
                    admin.status ||
                    "active"
                );


            const promoteButton =
                card.querySelector(
                    ".promote"
                );


            const removeButton =
                card.querySelector(
                    ".remove"
                );


            /*
             * Never allow the Superadmin
             * to accidentally remove themselves.
             */

            if (
                admin.id ===
                currentUser.id
            ) {

                promoteButton.disabled =
                    true;

                removeButton.disabled =
                    true;

                removeButton.textContent =
                    "👑 Your Account";

            }


            promoteButton.onclick =
            async () => {

                await changeRole(
                    admin
                );

            };


            removeButton.onclick =
            async () => {

                await removeAdministrator(
                    admin
                );

            };


            adminsContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SEARCH ADMINISTRATORS
========================================================= */

searchAdmin.addEventListener(
    "input",
    () => {

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


                    return (
                        username.includes(
                            keyword
                        )
                        ||
                        email.includes(
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


/* =========================================================
   SEARCH USERS TO ADD
========================================================= */

let searchTimer = null;


adminSearch.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        const keyword =
            adminSearch.value
                .trim();


        selectedProfile =
            null;


        selectedUser.style.display =
            "none";


        searchResults.innerHTML =
            "";


        if (
            keyword.length < 2
        ) {

            return;

        }


        searchTimer =
            setTimeout(
                () => {

                    searchUsers(
                        keyword
                    );

                },
                400
            );

    }
);


/* =========================================================
   SEARCH USERS
========================================================= */

async function searchUsers(
    keyword
) {

    searchResults.innerHTML = `
        <p>Searching...</p>
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
            status
        `)
        .or(
            `email.ilike.%${keyword}%,username.ilike.%${keyword}%`
        )
        .limit(10);


    if (error) {

        console.error(
            "USER SEARCH ERROR:",
            error
        );


        searchResults.innerHTML = `

            <p class="error-text">

                Unable to search users.

            </p>

        `;

        return;

    }


    const users =
        (data || []).filter(
            user =>

                user.role !==
                    "admin" &&

                user.role !==
                    "newsroom" &&

                user.role !==
                    "superadmin"

        );


    searchResults.innerHTML =
        "";


    if (
        users.length === 0
    ) {

        searchResults.innerHTML = `

            <p class="empty-search">

                No eligible users found.

            </p>

        `;

        return;

    }


    users.forEach(
        user => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "search-result";


            button.innerHTML = `

                <strong>
                    ${escapeHtml(
                        user.username ||
                        "No username"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        user.email ||
                        "No email"
                    )}
                </span>

            `;


            button.onclick =
            () => {

                selectUser(
                    user
                );

            };


            searchResults.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   SELECT USER
========================================================= */

function selectUser(
    user
) {

    selectedProfile =
        user;


    selectedUserName.textContent =
        user.username ||
        "No username";


    selectedUserEmail.textContent =
        user.email ||
        "No email";


    selectedUser.style.display =
        "flex";


    searchResults.innerHTML =
        "";


    adminSearch.value =
        user.email ||
        user.username ||
        "";

}


/* =========================================================
   ADD ADMINISTRATOR
========================================================= */

addAdmin.addEventListener(
    "click",
    async () => {

        if (!selectedProfile) {

            alert(
                "Search for and select a user first."
            );

            return;

        }


        const role =
            adminRole.value;


        if (
            ![
                "admin",
                "newsroom"
            ].includes(role)
        ) {

            alert(
                "Invalid administrator role."
            );

            return;

        }


        const confirmed =
            confirm(
                `Make ${selectedProfile.email} a ${role}?`
            );


        if (!confirmed) {

            return;

        }


        addAdmin.disabled =
            true;


        addAdmin.textContent =
            "Updating...";


        const {
            error
        } =
        await supabase
            .from("profiles")
            .update({
                role: role,
                status: "active"
            })
            .eq(
                "id",
                selectedProfile.id
            );


        if (error) {

            console.error(
                "ADD ADMIN ERROR:",
                error
            );


            alert(
                "Unable to add administrator:\n" +
                error.message
            );

        }
        else {

            alert(
                "Administrator added successfully."
            );


            selectedProfile =
                null;


            selectedUser.style.display =
                "none";


            selectedUserName.textContent =
                "";


            selectedUserEmail.textContent =
                "";


            adminSearch.value =
                "";


            await loadAdministrators();

        }


        addAdmin.disabled =
            false;


        addAdmin.textContent =
            "➕ Make Administrator";

    }
);


/* =========================================================
   CHANGE ROLE
========================================================= */

async function changeRole(
    admin
) {

    if (
        admin.id ===
        currentUser.id
    ) {

        return;

    }


    const newRole =
        prompt(
            `Current role: ${admin.role}\n\nEnter new role:\nadmin\nnewsroom`
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
            "Only admin or newsroom can be selected here."
        );

        return;

    }


    if (
        role ===
        admin.role
    ) {

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
            "ROLE CHANGE ERROR:",
            error
        );


        alert(
            "Unable to change role:\n" +
            error.message
        );

        return;

    }


    alert(
        "Administrator role updated."
    );


    await loadAdministrators();

}


/* =========================================================
   REMOVE ADMINISTRATOR
========================================================= */

async function removeAdministrator(
    admin
) {

    if (
        admin.id ===
        currentUser.id
    ) {

        alert(
            "You cannot remove your own Superadmin account."
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


    alert(
        "Administrator privileges removed."
    );


    await loadAdministrators();

}


/* =========================================================
   START
========================================================= */

(async function () {

    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;

        }


        await loadCurrentProfile();

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
