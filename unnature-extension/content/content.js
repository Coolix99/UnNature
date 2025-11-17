// content/content.js

// Small helper so it also works in Chrome later
const ext = typeof browser !== "undefined" ? browser : chrome;

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

// 2) arXiv: https://arxiv.org/abs/2511.10613
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

// 3) APS / PRL: https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.123.456789
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

// 4) Fallback: try to just find ANY DOI in the URL
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

// --- UI: floating, draggable, resizable, minimizable panel ---------------

function createOverlay(meta) {
    if (!meta.detected) {
        console.log("[UnNature] No scientific URL detected.", meta);
        return;
    }

    console.log("[UnNature] Detected paper:", meta);

    // Create container
    const container = document.createElement("div");
    container.id = "unnature-overlay";

    Object.assign(container.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "320px",
        height: "220px",
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


    // Header bar
    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "4px 8px",
        background: "rgba(40, 60, 120, 0.95)",
        cursor: "move",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    });

    header.textContent = `UnNature – ${meta.platform}`;

    const minimizeBtn = document.createElement("button");
    minimizeBtn.textContent = "×";
    minimizeBtn.style.cssText = `
        border: none;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 18px;
        margin-left: 10px;
    `;

    header.appendChild(minimizeBtn);
    container.appendChild(header);


    // Body
    const body = document.createElement("div");
    Object.assign(body.style, {
        flex: "1",
        padding: "6px",
        overflowY: "auto"
    });

    const info = document.createElement("pre");
    info.textContent = JSON.stringify(meta, null, 2);
    info.style.margin = "0";
    body.appendChild(info);

    container.appendChild(body);
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


    // --- Drag logic (same as before) ---
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener("mousedown", e => {
        isDragging = true;
        const r = container.getBoundingClientRect();
        offsetX = e.clientX - r.left;
        offsetY = e.clientY - r.top;
    });

    document.addEventListener("mouseup", () => isDragging = false);

    document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        container.style.left = (e.clientX - offsetX) + "px";
        container.style.top = (e.clientY - offsetY) + "px";
        container.style.right = "auto";
        container.style.bottom = "auto";
    });
}

// --- Main entry ----------------------------------------------------------

(function main() {
    try {
        const meta = detectPaper(window.location.href);
        createOverlay(meta);
    } catch (e) {
        console.error("[UnNature] Error in content script:", e);
    }
})();
