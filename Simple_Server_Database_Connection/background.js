// chrome.tabs.onActivated.addListener((activeInfo) => {
//   chrome.tabs.get(activeInfo.tabId, (tab) => {
//     const url = tab.url;

//     // Check if there is a comment for this URL
//     fetch(`http://localhost:5000/comments?url=${encodeURIComponent(url)}`)
//       .then(response => response.json())
//       .then(data => {
//         if (data.comment) {
//           alert(`Comment for this page: ${data.comment}`);
//         }
//       });
//   });
// });





// Listen for tab activation (when the user switches to a new tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkForComments(tab.url); // Check for comments on the new active tab
    }
  });
});

// Listen for tab updates (e.g., page loads or URL changes within the same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkForComments(tab.url); // Check for comments when the tab finishes loading
  }
});

// Function to check if there are comments for the given URL
function checkForComments(url) {
  fetch(`http://localhost:5000/comments?url=${encodeURIComponent(url)}`)
    .then(response => {
      if (!response.ok) throw new Error('No comments found.');
      return response.json();
    })
    .then(data => {
      if (data.comment) {
        // If a comment exists, set the badge
        chrome.action.setBadgeText({ text: '1' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Red background
      } else {
        // Clear the badge if no comment is available
        chrome.action.setBadgeText({ text: '' });
      }
    })
    .catch(error => {
      console.error('Error fetching comments:', error);
      // Clear the badge on error
      chrome.action.setBadgeText({ text: '' });
    });
}

// Clean up when the extension is disabled or unloaded
chrome.runtime.onSuspend.addListener(() => {
  chrome.action.setBadgeText({ text: '' }); // Clear the badge
});

// Optional: Listen for messages from the popup if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_COMMENTS') {
    checkForComments(message.url); // Allow manual check from the popup
    sendResponse({ success: true });
  }
});



// // icon animation if wanted
// // Variables to manage icon animation
// let animationInterval = null;

// // Start icon animation (blinking effect)
// function startIconAnimation() {
//   if (animationInterval) return; // Prevent multiple intervals

//   let isHighlighted = false;
//   animationInterval = setInterval(() => {
//     const iconPath = isHighlighted ? 'icon-default.png' : 'icon-highlighted.png';
//     chrome.action.setIcon({ path: iconPath });
//     isHighlighted = !isHighlighted;
//   }, 500); // Toggle every 500ms
// }

// // Stop icon animation
// function stopIconAnimation() {
//   if (animationInterval) {
//     clearInterval(animationInterval);
//     animationInterval = null;

//     // Reset to default icon
//     chrome.action.setIcon({ path: 'icon-default.png' });
//   }
// }