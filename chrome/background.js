// // this script is run in the background of the extension and works all the time

// // listen for any changes to the URL of any tab.

// // Path to the CSV file
// const filePath = "/home/eric/Downloads/current_url.csv";

// // Function to read and parse the CSV file
// async function readCSV() {
//     try {
//         const response = await fetch(`file://${filePath}`);
//         if (!response.ok) {
//             throw new Error(`Failed to fetch file: ${response.statusText}`);
//         }
//         const fileContent = await response.text();
//         const lines = fileContent.split("\n");

//         if (lines.length < 2) {
//             console.error("CSV file does not contain valid data.");
//             return null;
//         }

//         // Parse the CSV (assuming Subcategory, URL, Text structure)
//         const headers = lines[0].split(",");
//         const data = lines[1].split(","); // Using the first row of data
//         return {
//             subcategory: data[0]?.trim().replace(/"/g, ""),
//             url: data[1]?.trim().replace(/"/g, ""),
//             comment: data[2]?.trim().replace(/"/g, "")
//         };
//     } catch (error) {
//         console.error("Error reading CSV file:", error);
//         return null;
//     }
// }

// // Function to check the current tab's URL against the CSV data
// async function checkURL(tabId, changeInfo, tab) {
//     if (changeInfo.status === "complete" && tab.url) {
//         const csvData = await readCSV();
//         if (!csvData) {
//             console.error("Failed to load CSV data.");
//             return;
//         }

//         // Compare the tab's URL with the URL from the CSV
//         if (tab.url === csvData.url) {
//             // URLs match, raise an alert with the comment
//             chrome.scripting.executeScript({
//                 target: { tabId: tab.id },
//                 func: (comment) => {
//                     alert(`Comment for this page: "${comment}"`);
//                 },
//                 args: [csvData.comment]
//             });
//         }
//     }
// }

// This will be triggered when a new tab is created
console.log("Background script loaded!");  // This should print when the background is initialized.


// Listen for existing tabs where the URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has finished loading (status == "complete")
    if (changeInfo.status === "complete") {
        const currentUrl = tab.url || tab.pendingUrl;

        // Skip Chrome internal pages (like new-tab-page, settings, etc.)
        if (currentUrl && (currentUrl.startsWith("chrome://") || currentUrl.startsWith("about:"))) {
            console.log("Skipping Chrome internal page:", currentUrl);
            return;
        }

        // Only execute if it's a regular webpage (http:// or https://)
        if (currentUrl && currentUrl.startsWith("http")) {
            console.log("Valid URL:", currentUrl);
            showAlert(currentUrl, tab.id);
        }
    }
});

// Function to show the alert
function showAlert(url, id) {
    // Show an alert directly in the background script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Here we are querying the active tab in the current window
        const tab = tabs[0];
        console.log("tabs:", tabs);
        console.log("tab url:", tab.url);
        if (url) {
            // Show alert with URL
            console.log("now script should be executed");
            chrome.scripting.executeScript({
                target: { tabId: id },
                files: ["script.js"],
            });
        }
    });

}

