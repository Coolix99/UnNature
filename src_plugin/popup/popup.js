document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("title");
    const messageElement = document.getElementById("message");
    const commentField = document.getElementById("comment-field");
    const saveButton = document.getElementById("save-button");
  
    try {
      // Get the current active tab's URL
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const url = tab.url;
  
      // Check if the URL is an arXiv paper
      const arxivPattern = /^https:\/\/arxiv\.org\/abs\/(\d{4}\.\d{5}(v\d+)?)$/;
      const match = url.match(arxivPattern);
  
      if (match) {
        const arxivId = match[1]; // Extract the arXiv ID
        titleElement.textContent = "ArXiv Paper Detected!";
        messageElement.textContent = `Adding a comment for paper: ${arxivId}`;
        commentField.style.display = "block";
        saveButton.style.display = "block";
  
        // Save the comment and arXiv ID
        saveButton.addEventListener("click", async () => {
          const comment = commentField.value.trim();
  
          if (comment) {
            // Save the comment to the storage file
            await saveComment(arxivId, comment);
            alert("Comment saved successfully!");
            commentField.value = ""; // Clear the input field
          } else {
            alert("Please write a comment before saving.");
          }
        });
      } else {
        titleElement.textContent = "Not an ArXiv Paper";
        messageElement.textContent = "Please visit an arXiv paper page to use this extension.";
      }
    } catch (error) {
      console.error("Error retrieving tab information:", error);
      titleElement.textContent = "Error";
      messageElement.textContent = "Could not retrieve tab information.";
    }
  });
  
  async function saveComment(arxivId, comment) {
    try {
      console.log("Saving comment...");
      const blob = new Blob([`arXiv ID: ${arxivId}\nComment: ${comment}\n\n`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const fileHandle = await browser.downloads.download({
        url,
        filename: `arxiv_comments.txt`,
        saveAs: false
      });
      console.log("File saved successfully with ID:", fileHandle);
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save the file. Check permissions or console for details.");
    }
  }
  