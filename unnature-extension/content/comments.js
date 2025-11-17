// comments.js — local DB + comment operations

const ext = typeof browser !== "undefined" ? browser : chrome;
const DB_KEY = "unnatureLocalDB";

// ---------------- DB LOAD / SAVE ----------------

async function loadDB() {
    const res = await ext.storage.local.get(DB_KEY);

    if (!res[DB_KEY]) {
        const empty = {
            settings: { localFolderLabel: "" },
            comments: {}
        };
        await ext.storage.local.set({ [DB_KEY]: empty });
        return empty;
    }

    return res[DB_KEY];
}

async function saveDB(db) {
    await ext.storage.local.set({ [DB_KEY]: db });
}

// ---------------- KEY GEN ----------------

function getPaperKey(meta) {
    return meta.doi || meta.articleId || meta.url;
}

// ---------------- COMMENTS ----------------

async function addComment(paperKey, parentId, text) {
    const db = await loadDB();
    if (!db.comments[paperKey]) db.comments[paperKey] = [];

    const comment = {
        id: "c_" + Date.now() + "_" + Math.random().toString(36).slice(2),
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

async function updateCommentText(paperKey, id, newText) {
    const db = await loadDB();
    const list = db.comments[paperKey] || [];
    const c = list.find(x => x.id === id);
    if (!c) return;
    c.text = newText;
    await saveDB(db);
}

// ---------------- SETTINGS ----------------

async function saveFolderLabel(label) {
    const db = await loadDB();
    db.settings.localFolderLabel = label;
    await saveDB(db);
}

async function getFolderLabel() {
    const db = await loadDB();
    return db.settings.localFolderLabel;
}
