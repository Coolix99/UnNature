async function updateUI() {
    const user = await browser.runtime.sendMessage({ type: "getUser" });
    const area = document.getElementById("user-area");
    const login = document.getElementById("login-btn");
    const logout = document.getElementById("logout-btn");

    if (user) {
        area.textContent = "Logged in as: " + user.name;
        login.style.display = "none";
        logout.style.display = "block";
    } else {
        area.textContent = "Not logged in";
        login.style.display = "block";
        logout.style.display = "none";
    }
}

document.getElementById("login-btn").addEventListener("click", async () => {
    await browser.runtime.sendMessage({ type: "loginTestUser" });
    updateUI();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    await browser.runtime.sendMessage({ type: "logout" });
    updateUI();
});

document.getElementById("orcid-login").addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "auth.orcidLogin" });
});


updateUI();
