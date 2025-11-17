(function main() {
    try {
        const meta = detectPaper(window.location.href);
        if (!meta.detected) {
            console.log("[UnNature] No scientific article detected.");
            return;
        }

        const ui = createOverlay(meta);
        initCommentsAndSettings(meta, ui);

    } catch (e) {
        console.error("[UnNature] Error:", e);
    }
})();
