// ui.js — overlay + rendering + UI logic

function renderMarkdown(text) {
    if (typeof marked === "undefined") return text;
    
    // First, render markdown
    let html = marked.parse(text);
    
    // Then, render math expressions if KaTeX is available
    if (typeof katex !== "undefined") {
        // Replace inline math: $...$
        html = html.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
            try {
                return katex.renderToString(math, { throwOnError: false, displayMode: false });
            } catch (e) {
                return match;
            }
        });
        
        // Replace display math: $$...$$
        html = html.replace(/\$\$([^\$]+?)\$\$/g, (match, math) => {
            try {
                return katex.renderToString(math, { throwOnError: false, displayMode: true });
            } catch (e) {
                return match;
            }
        });
    }
    
    return html;
}

// ---------------- CREATE OVERLAY ----------------

function createOverlay(meta) {

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

    // ---------- bubble ----------
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

    // ---------- header ----------
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

    const settingsToggle = document.createElement("button");
    settingsToggle.textContent = "⚙";
    settingsToggle.style.cssText = "border:none;background:transparent;color:white;cursor:pointer;margin-right:6px;font-size:14px;";

    const minimizeBtn = document.createElement("button");
    minimizeBtn.textContent = "×";
    minimizeBtn.style.cssText = "border:none;background:transparent;color:white;cursor:pointer;font-size:16px;";

    headerButtons.appendChild(settingsToggle);
    headerButtons.appendChild(minimizeBtn);
    header.appendChild(headerButtons);
    container.appendChild(header);

    // ---------- body ----------
    const body = document.createElement("div");
    Object.assign(body.style, {
        flex: "1",
        display: "flex",
        flexDirection: "column",
        padding: "6px",
        overflow: "hidden",
        fontSize: "12px"
    });

    const metaDiv = document.createElement("div");
    metaDiv.innerHTML =
        `<div><b>DOI:</b> ${meta.doi || "<i>none</i>"}</div>` +
        `<div><b>ID:</b> ${meta.articleId || "<i>n/a</i>"}</div>`;
    body.appendChild(metaDiv);

    const commentsTitle = document.createElement("div");
    commentsTitle.textContent = "Your local comments:";
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

    const newComment = document.createElement("textarea");
    Object.assign(newComment.style, {
        width: "100%",
        minHeight: "40px",
        marginBottom: "2px"
    });
    newComment.placeholder = "Write a comment...";
    body.appendChild(newComment);

    const addButton = document.createElement("button");
    addButton.textContent = "Add comment";
    addButton.style.cssText = `
        width:100%;padding:4px;font-size:12px;border:none;border-radius:4px;
        background:rgba(80, 140, 220, 0.9);color:white;margin-bottom:4px;
    `;
    body.appendChild(addButton);

    // ---------- settings ----------
    const settingsPanel = document.createElement("div");
    settingsPanel.style.display = "none";

    const settingsLabel = document.createElement("label");
    settingsLabel.textContent = "Local folder label:";
    const folderInput = document.createElement("input");

    settingsPanel.appendChild(settingsLabel);
    settingsPanel.appendChild(folderInput);
    body.appendChild(settingsPanel);

    container.appendChild(body);

    // ---------- resizer ----------
    let isDragging = false, isResizing = false;
    let offsetX, offsetY, startX, startY, startWidth, startHeight;

    const resizer = document.createElement("div");
    resizer.style.cssText = `
        position:absolute;bottom:2px;right:2px;width:12px;height:12px;
        cursor:se-resize;background:rgba(255,255,255,0.3);border-radius:3px;
    `;
    container.appendChild(resizer);

    document.body.appendChild(container);

    // ---------- events ----------
    minimizeBtn.onclick = () => {
        container.style.display = "none";
        bubble.style.display = "flex";
    };
    bubble.onclick = () => {
        container.style.display = "flex";
        bubble.style.display = "none";
    };

    settingsToggle.onclick = () => {
        settingsPanel.style.display =
            settingsPanel.style.display === "none" ? "block" : "none";
    };

    header.onmousedown = (e) => {
        isDragging = true;
        const r = container.getBoundingClientRect();
        offsetX = e.clientX - r.left;
        offsetY = e.clientY - r.top;
    };

    resizer.onmousedown = (e) => {
        isResizing = true;
        const r = container.getBoundingClientRect();
        startWidth = r.width;
        startHeight = r.height;
        startX = e.clientX;
        startY = e.clientY;
        e.stopPropagation();
    };

    document.onmouseup = () => { isDragging = false; isResizing = false; };

    document.onmousemove = (e) => {
        if (isDragging) {
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
        }
        if (isResizing) {
            container.style.width = Math.max(260, startWidth + (e.clientX - startX)) + "px";
            container.style.height = Math.max(180, startHeight + (e.clientY - startY)) + "px";
        }
    };

    return {
        container,
        bubble,
        commentsContainer,
        newComment,
        addButton,
        folderInput
    };
}

// ---------------- RENDER TREE ----------------

function renderCommentsTree(comments, parentId, container, depth, meta) {
    const children = comments.filter(c => c.parentId === parentId);
    children.sort((a, b) => a.createdAt - b.createdAt);

    for (const c of children) {
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = (depth * 12) + "px";
        wrapper.style.marginBottom = "8px";

        const textDiv = document.createElement("div");
        textDiv.innerHTML = renderMarkdown(c.text);
        textDiv.style.padding = "3px";
        textDiv.style.background = "rgba(255,255,255,0.05)";
        textDiv.style.borderRadius = "3px";
        wrapper.appendChild(textDiv);

        const dateDiv = document.createElement("div");
        dateDiv.textContent = new Date(c.createdAt).toLocaleString();
        dateDiv.style.fontSize = "10px";
        dateDiv.style.opacity = "0.7";
        dateDiv.style.marginTop = "2px";
        wrapper.appendChild(dateDiv);

        const btnContainer = document.createElement("div");
        btnContainer.style.marginTop = "4px";

        const replyBtn = document.createElement("button");
        replyBtn.textContent = "Reply";
        replyBtn.style.cssText = "font-size:10px;margin-right:4px;padding:2px 6px;cursor:pointer;";
        btnContainer.appendChild(replyBtn);

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.style.cssText = "font-size:10px;margin-right:4px;padding:2px 6px;cursor:pointer;";
        btnContainer.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.style.cssText = "font-size:10px;padding:2px 6px;cursor:pointer;background:rgba(200,50,50,0.7);color:white;border:none;border-radius:3px;";
        btnContainer.appendChild(deleteBtn);

        wrapper.appendChild(btnContainer);

        replyBtn.onclick = () => {
            const textarea = container.closest("#unnature-overlay").querySelector("textarea");
            textarea.dataset.replyTo = c.id;
            textarea.placeholder = "Reply to comment…";
            textarea.focus();
        };

        editBtn.onclick = async () => {
            const newText = prompt("Edit comment:", c.text);
            if (newText !== null && newText.trim()) {
                const paperKey = getPaperKey(meta);
                await updateCommentText(paperKey, c.id, newText.trim());
                const updated = await getComments(paperKey);
                container.innerHTML = "";
                if (updated.length === 0) {
                    const empty = document.createElement("div");
                    empty.textContent = "No comments yet.";
                    empty.style.opacity = "0.7";
                    container.appendChild(empty);
                } else {
                    renderCommentsTree(updated, null, container, 0, meta);
                }
            }
        };

        deleteBtn.onclick = async () => {
            if (confirm("Delete this comment?")) {
                const paperKey = getPaperKey(meta);
                await deleteComment(paperKey, c.id);
                const updated = await getComments(paperKey);
                container.innerHTML = "";
                if (updated.length === 0) {
                    const empty = document.createElement("div");
                    empty.textContent = "No comments yet.";
                    empty.style.opacity = "0.7";
                    container.appendChild(empty);
                } else {
                    renderCommentsTree(updated, null, container, 0, meta);
                }
            }
        };

        container.appendChild(wrapper);
        renderCommentsTree(comments, c.id, container, depth + 1, meta);
    }
}

// ---------------- INIT ----------------

async function initCommentsAndSettings(meta, ui) {
    const paperKey = getPaperKey(meta);

    const comments = await getComments(paperKey);
    ui.commentsContainer.innerHTML = "";
    if (comments.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "No comments yet.";
        empty.style.opacity = "0.7";
        ui.commentsContainer.appendChild(empty);
    } else {
        renderCommentsTree(comments, null, ui.commentsContainer, 0, meta);
    }

    ui.addButton.onclick = async () => {
        const text = ui.newComment.value.trim();
        if (!text) return;

        const parentId = ui.newComment.dataset.replyTo || null;
        await addComment(paperKey, parentId, text);

        ui.newComment.value = "";
        ui.newComment.dataset.replyTo = "";
        ui.newComment.placeholder = "Write a comment...";

        const updated = await getComments(paperKey);
        ui.commentsContainer.innerHTML = "";
        renderCommentsTree(updated, null, ui.commentsContainer, 0, meta);
    };

    const label = await getFolderLabel();
    ui.folderInput.value = label;
    ui.folderInput.onchange = async () => {
        await saveFolderLabel(ui.folderInput.value.trim());
    };
}
