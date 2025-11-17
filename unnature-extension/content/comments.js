// comments.js — local DB + comment operations

// Note: ext, DB_KEY, loadDB, saveDB, getPaperKey are defined in detect.js

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

async function deleteComment(paperKey, id) {
    const db = await loadDB();
    const list = db.comments[paperKey] || [];
    db.comments[paperKey] = list.filter(x => x.id !== id);
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
