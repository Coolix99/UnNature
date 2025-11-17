// content/content.js

// Small helper so it also works in Chrome later
const ext = typeof browser !== "undefined" ? browser : chrome;

const DB_KEY = "unnatureLocalDB";

// --- DOI detection and journal-specific detectors ------------------------

const DOI_REGEX = /10\.\d{4,9}\/[^\s?#]+/;

/**
 * Detects paper info from the current URL.
 * Returns an object with:
 *   detected: boolean
 *   platform: 'nature' | 'arxiv' | 'aps' | 'generic' | null
 *   articleId: string | null
 *   doi: string | null
 *   url: string
 */
function detectPaper(urlString) {
    const url = new URL(urlString);

    // Base result
    const result = {
        detected: false,
        platform: null,
        articleId: null,
        doi: null,
        url: url.href
    };

    // Try journal-specific detectors in order
    const detectors = [detectNature, detectArxiv, detectAPS, detectGenericDOI];

    for (const det of detectors) {
        const r = det(url);
        if (r && r.detected) {
            return r;
        }
    }

    return result;
}

// --- Specific detectors --------------------------------------------------

// 1) Nature: https://www.nature.com/articles/d41586-025-03755-5
// DOI is usually: 10.1038/<articleId>
function detectNature(url) {
    if (url.hostname !== "www.nature.com") return null;
    if (!url.pathname.startsWith("/articles/")) return null;

    const articleId = url.pathname.split("/").filter(Boolean).pop();
    const doi = `10.1038/${articleId}`;

    return {
        detected: true,
        platform: "nature",
        articleId,
        doi,
        url: url.href
    };
}

// arXiv: https://arxiv.org/abs/2511.10613
// arXiv "DOI" is often 10.48550/arXiv.<id>, but we'll mark both.
function detectArxiv(url) {
    if (url.hostname !== "arxiv.org") return null;
    if (!url.pathname.startsWith("/abs/") && !url.pathname.startsWith("/pdf/")) {
        return null;
    }

    const parts = url.pathname.split("/");
    const id = parts[2]; // /abs/<id> or /pdf/<id>

    const doi = `10.48550/arXiv.${id}`;

    return {
        detected: true,
        platform: "arxiv",
        articleId: id,
        doi,
        url: url.href
    };
}

// APS / PRL: https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.123.456789
// The DOI is in the URL, we just extract with the generic DOI regex.
function detectAPS(url) {
    if (!url.hostname.endsWith("aps.org")) return null;

    const match = url.href.match(DOI_REGEX);
    if (!match) return null;

    const doi = match[0];

    return {
        detected: true,
        platform: "aps",
        articleId: doi, // or you could split it further if you like
        doi,
        url: url.href
    };
}

// Fallback: try to just find ANY DOI in the URL
function detectGenericDOI(url) {
    const match = url.href.match(DOI_REGEX);
    if (!match) {
        return {
            detected: false,
            platform: null,
            articleId: null,
            doi: null,
            url: url.href
        };
    }

    const doi = match[0];

    return {
        detected: true,
        platform: "generic",
        articleId: doi,
        doi,
        url: url.href
    };
}

// --- Local "database" in storage.local -----------------------------------

async function loadDB() {
    const res = await ext.storage.local.get(DB_KEY);
    if (!res[DB_KEY]) {
        return {
            settings: {
                localFolderLabel: ""   // user-defined text label (later used for export)
            },
            comments: {
                // paperKey -> Comment[]
            }
        };
    }
    return res[DB_KEY];
}

async function saveDB(db) {
    await ext.storage.local.set({ [DB_KEY]: db });
}

function getPaperKey(meta) {
    // Prefer DOI; then articleId; finally full URL.
    return meta.doi || meta.articleId || meta.url;
}

// Comment structure:
// {
//   id: string,
//   parentId: string|null,
//   text: string,
//   createdAt: number
// }

async function addComment(paperKey, parentId, text) {
    const db = await loadDB();
    if (!db.comments[paperKey]) {
        db.comments[paperKey] = [];
    }
    const comment = {
        id: "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        parentId: parentId || null,
        text,
        createdAt: Date.now()
    };
    db.comments[paperKey].push(comment);
    await saveDB(db);
    return comment;
}

async function getComments(paperKey) {
    const db = await loadDB();
    return db.comments[paperKey] || [];
}

async function saveFolderLabel(label) {
    const db = await loadDB();
    db.settings.localFolderLabel = label;
    await saveDB(db);
}

async function getFolderLabel() {
    const db = await loadDB();
    return db.settings.localFolderLabel || "";
}

// --- UI: floating, draggable, resizable, minimizable panel ---------------

function createOverlay(meta) {
    console.log("[UnNature] Detected paper:", meta);

    const container = document.createElement("div");
    container.id = "unnature-overlay";

    Object.assign(container.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "360px",
        height: "260px",
        background: "rgba(15, 20, 40, 0.95)",
        color: "white",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 8px rgba(0,0,0,0.6)",
        zIndex: "999999",
        overflow: "hidden"
    });

    // --- MINIMIZED BUBBLE ---
    const bubble = document.createElement("div");
    bubble.id = "unnature-bubble";

    Object.assign(bubble.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "rgba(40, 60, 120, 0.95)",
        color: "white",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "20px",
        boxShadow: "0 0 6px rgba(0,0,0,0.6)",
        zIndex: "999999"
    });
    bubble.textContent = "U";
    document.body.appendChild(bubble);

    // Header (drag handle)
    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "4px 8px",
        background: "rgba(40, 60, 120, 0.95)",
        cursor: "move",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px"
    });

    const titleSpan = document.createElement("span");
    titleSpan.textContent = `UnNature – ${meta.platform || "paper"}`;
    header.appendChild(titleSpan);

    const headerButtons = document.createElement("div");
    headerButtons.style.display = "flex";
    headerButtons.style.alignItems = "center";

    const settingsToggle = document.createElement("button");
    settingsToggle.textContent = "⚙";
    settingsToggle.title = "Settings";
    settingsToggle.style.cssText = `
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 14px;
        margin-right: 6px;
    `;

    const minimizeBtn = document.createElement("button");
    minimizeBtn.textContent = "×";
    minimizeBtn.title = "Hide to corner";
    minimizeBtn.style.cssText = `
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 16px;
    `;

    headerButtons.appendChild(settingsToggle);
    headerButtons.appendChild(minimizeBtn);
    header.appendChild(headerButtons);

    container.appendChild(header);

    // Body wrapper
    const body = document.createElement("div");
    Object.assign(body.style, {
        flex: "1",
        display: "flex",
        flexDirection: "column",
        padding: "6px",
        overflow: "hidden",
        fontSize: "12px"
    });

    // Meta info
    const metaDiv = document.createElement("div");
    metaDiv.style.marginBottom = "4px";
    metaDiv.innerHTML =
        `<div><b>DOI:</b> ${meta.doi || "<i>none detected</i>"}</div>` +
        `<div><b>Article ID:</b> ${meta.articleId || "<i>n/a</i>"}</div>`;

    body.appendChild(metaDiv);

    // Comments container
    const commentsTitle = document.createElement("div");
    commentsTitle.textContent = "Your local comments:";
    commentsTitle.style.margin = "4px 0 2px 0";
    commentsTitle.style.fontWeight = "bold";
    body.appendChild(commentsTitle);

    const commentsContainer = document.createElement("div");
    Object.assign(commentsContainer.style, {
        flex: "1",
        overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "4px",
        borderRadius: "4px",
        marginBottom: "4px",
        background: "rgba(0,0,0,0.15)"
    });
    body.appendChild(commentsContainer);

    // New comment input
    const newComment = document.createElement("textarea");
    Object.assign(newComment.style, {
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        minHeight: "40px",
        maxHeight: "80px",
        marginBottom: "2px",
        fontSize: "12px"
    });
    newComment.placeholder = "Write a comment...";

    const addButton = document.createElement("button");
    addButton.textContent = "Add comment";
    addButton.style.cssText = `
        width: 100%;
        padding: 4px;
        font-size: 12px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        background: rgba(80, 140, 220, 0.9);
        color: white;
        margin-bottom: 4px;
    `;

    body.appendChild(newComment);
    body.appendChild(addButton);

    // Settings panel (collapsed by default)
    const settingsPanel = document.createElement("div");
    Object.assign(settingsPanel.style, {
        borderTop: "1px solid rgba(255,255,255,0.2)",
        paddingTop: "4px",
        marginTop: "2px",
        display: "none",
        fontSize: "11px"
    });

    const settingsLabel = document.createElement("label");
    settingsLabel.textContent = "Local folder label:";
    settingsLabel.style.display = "block";
    settingsLabel.style.marginBottom = "2px";

    const folderInput = document.createElement("input");
    folderInput.type = "text";
    Object.assign(folderInput.style, {
        width: "100%",
        boxSizing: "border-box",
        fontSize: "11px"
    });

    settingsPanel.appendChild(settingsLabel);
    settingsPanel.appendChild(folderInput);
    body.appendChild(settingsPanel);

    container.appendChild(body);

    // Resize handle
    const resizer = document.createElement("div");
    Object.assign(resizer.style, {
        position: "absolute",
        width: "12px",
        height: "12px",
        bottom: "2px",
        right: "2px",
        cursor: "se-resize",
        background: "rgba(255,255,255,0.3)",
        borderRadius: "3px"
    });
    container.appendChild(resizer);

    document.body.appendChild(container);

    // --- Minimize / restore ---
    minimizeBtn.addEventListener("click", () => {
        container.style.display = "none";
        bubble.style.display = "flex";
    });

    bubble.addEventListener("click", () => {
        container.style.display = "flex";
        bubble.style.display = "none";
    });

    // --- Drag logic ---
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        const r = container.getBoundingClientRect();
        offsetX = e.clientX - r.left;
        offsetY = e.clientY - r.top;
        e.preventDefault();
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        isResizing = false;
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            container.style.left = (e.clientX - offsetX) + "px";
            container.style.top = (e.clientY - offsetY) + "px";
            container.style.right = "auto";
            container.style.bottom = "auto";
        } else if (isResizing) {
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);
            container.style.width = Math.max(260, newWidth) + "px";
            container.style.height = Math.max(180, newHeight) + "px";
        }
    });

    // --- Resize logic ---
    let isResizing = false;
    let startWidth, startHeight, startX, startY;

    resizer.addEventListener("mousedown", (e) => {
        isResizing = true;
        const rect = container.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
        e.stopPropagation();
    });

    // --- Settings toggle ---
    settingsToggle.addEventListener("click", () => {
        settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
    });

    // Expose elements we need for comments + settings
    return {
        container,
        bubble,
        commentsContainer,
        newComment,
        addButton,
        folderInput
    };
}

// Render comments tree
function renderCommentsTree(comments, parentId, container, depth) {
    const children = comments.filter(c => c.parentId === parentId);
    children.sort((a, b) => a.createdAt - b.createdAt);

    for (const c of children) {
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = depth * 12 + "px";
        wrapper.style.marginBottom = "4px";

        const textDiv = document.createElement("div");
        textDiv.textContent = c.text;
        textDiv.style.padding = "3px 4px";
        textDiv.style.borderRadius = "3px";
        textDiv.style.background = "rgba(255,255,255,0.06)";
        textDiv.style.cursor = "default";
        wrapper.appendChild(textDiv);

        const metaDiv = document.createElement("div");
        metaDiv.style.fontSize = "10px";
        metaDiv.style.opacity = "0.7";
        metaDiv.textContent = new Date(c.createdAt).toLocaleString();
        wrapper.appendChild(metaDiv);

        const replyBtn = document.createElement("button");
        replyBtn.textContent = "Reply";
        replyBtn.style.cssText = `
            font-size: 10px;
            margin-top: 2px;
            border: none;
            border-radius: 3px;
            padding: 1px 4px;
            cursor: pointer;
        `;
        wrapper.appendChild(replyBtn);

        container.appendChild(wrapper);

        replyBtn.addEventListener("click", () => {
            // Mark reply context by storing parentId on textarea element
            const textarea = container.closest("#unnature-overlay").querySelector("textarea");
            textarea.dataset.replyTo = c.id;
            textarea.placeholder = "Reply to comment…";
            textarea.focus();
        });

        // Recurse for children
        renderCommentsTree(comments, c.id, container, depth + 1);
    }
}

async function initCommentsAndSettings(meta, ui) {
    const paperKey = getPaperKey(meta);

    // Load comments
    const comments = await getComments(paperKey);
    ui.commentsContainer.innerHTML = "";
    if (comments.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "No comments yet.";
        empty.style.opacity = "0.7";
        ui.commentsContainer.appendChild(empty);
    } else {
        renderCommentsTree(comments, null, ui.commentsContainer, 0);
    }

    // Add new comment
    ui.addButton.addEventListener("click", async () => {
        const text = ui.newComment.value.trim();
        if (!text) return;

        const parentId = ui.newComment.dataset.replyTo || null;
        await addComment(paperKey, parentId, text);

        // Reset input
        ui.newComment.value = "";
        ui.newComment.dataset.replyTo = "";
        ui.newComment.placeholder = "Write a comment...";

        // Re-render
        const updated = await getComments(paperKey);
        ui.commentsContainer.innerHTML = "";
        renderCommentsTree(updated, null, ui.commentsContainer, 0);
    });

    // Settings: load and save folder label
    const label = await getFolderLabel();
    ui.folderInput.value = label;

    ui.folderInput.addEventListener("change", async () => {
        await saveFolderLabel(ui.folderInput.value.trim());
    });
}

// --- Main entry ----------------------------------------------------------

(async function main() {
    try {
        const meta = detectPaper(window.location.href);
        if (!meta.detected) {
            console.log("[UnNature] No scientific URL detected.", meta);
            return;
        }
        const ui = createOverlay(meta);
        await initCommentsAndSettings(meta, ui);
    } catch (e) {
        console.error("[UnNature] Error in content script:", e);
    }
})();