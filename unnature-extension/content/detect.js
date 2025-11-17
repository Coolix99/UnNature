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

