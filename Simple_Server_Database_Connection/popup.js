document.addEventListener('DOMContentLoaded', function () {
    // Fetch the active tab's URL when the popup is opened
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            console.error('No active tabs found.');
            return;
        }

        const activeTab = tabs[0];
        const url = activeTab.url;

        if (!url) {
            console.error('URL is undefined.');
            return;
        }

        console.log("Active tab URL: ", url); // Log the URL to verify it's correct

        // Fetch any existing comment for this URL from the server
        fetch(`http://127.0.0.1:5000/comments/${encodeURIComponent(url)}`)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('No comment found.');
                }
            })
            .then((data) => {
                document.getElementById('comment-display').textContent = `Comment: ${data.comment}`;

                // Notify the background script to set a badge
                chrome.runtime.sendMessage({ type: 'SET_BADGE', text: '1' });
            })
            .catch((error) => {
                console.error('Error fetching comment:', error);
                document.getElementById('comment-display').textContent = 'No comment found.';

                // Clear the badge if no comment is found
                chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' });
            });

        // Add event listener to save the comment
        document.getElementById('saveComment').addEventListener('click', function () {
            const commentText = document.getElementById('comment').value;

            if (commentText) {
                // Send POST request to the server with the correct URL and comment text
                fetch('http://127.0.0.1:5000/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url, comment: commentText }),
                })
                    .then((response) => {
                        if (response.ok) {
                            alert('Comment saved!');
                            document.getElementById('comment-display').textContent = `Comment: ${commentText}`;
                            document.getElementById('comment').value = ''; // Clear the input field
                        } else {
                            return response.json().then(err => {
                                console.error('Server error:', err);
                                alert('Error saving comment.');
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Network error:', error);
                        alert('Network error while saving comment.');
                    });
            } else {
                alert('Please write a comment.');
            }
        });
    });
});
