async function loginWithORCID() {
    const clientId = "YOUR_ORCID_CLIENT_ID";
    const redirectUri = "https://your-server.com/orcid/callback";

    const authUrl =
        `https://orcid.org/oauth/authorize?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&scope=/authenticate` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // open login tab
    const authTab = await browser.tabs.create({ url: authUrl });

    // listen for redirect to your server
    function handleUpdate(tabId, changeInfo, tab) {
        if (tabId !== authTab.id) return;

        if (changeInfo.url && changeInfo.url.startsWith("https://your-server.com/orcid/callback")) {
            console.log("[ORCID] Received redirect:", changeInfo.url);

            browser.tabs.remove(authTab.id);

            // call your server to exchange code for your token
            fetch(changeInfo.url)
                .then(r => r.json())
                .then(async data => {
                    console.log("[ORCID] Server returned", data);
                    await browser.storage.local.set({ unnatureToken: data.token });
                })
                .catch(err => console.error(err));

            browser.tabs.onUpdated.removeListener(handleUpdate);
        }
    }

    browser.tabs.onUpdated.addListener(handleUpdate);
}


// message handler
browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "auth.orcidLogin") {
        loginWithORCID();
    }
});
