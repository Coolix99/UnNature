chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      const url = tab.url;
  
      // Check if there is a comment for this URL
      fetch(`http://localhost:5000/comments?url=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(data => {
          if (data.comment) {
            alert(`Comment for this page: ${data.comment}`);
          }
        });
    });
  });