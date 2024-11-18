document.getElementById("downloadBtn").addEventListener("click", async () => {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url) {
        // Create a CSV content
        const csvContent = `URL\n${tab.url}`;

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: "text/csv" });

        // Create a temporary anchor element to trigger the download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "current_url.csv";

        // Trigger the download
        a.click();

        // Clean up the object URL
        URL.revokeObjectURL(url);
    } else {
        alert("Unable to fetch the current tab URL.");
    }
});




// Upload button functionality
document.getElementById("uploadBtn").addEventListener("click", async () => {
    // Define the path to the file (adjust for your OS environment if needed)
    const filePath = "/home/eric/Downloads/current_url.csv";

    try {
        // Fetch the file using a file URL
        const response = await fetch(`file://${filePath}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        // Get the text content of the file
        const fileContent = await response.text();

        // Process the content (parsing CSV in this case)
        const lines = fileContent.split("\n");
        const url = lines[1]?.trim(); // Extract the URL from the second line

        if (url) {
            alert(`URL from file: ${url}`);
        } else {
            alert("The file is empty or does not contain a valid URL.");
        }
    } catch (error) {
        console.error("Error reading file:", error);
        alert("Failed to read the file. Ensure the file exists and is accessible.");
    }
});


// Logic for going to subcategories
// refer to id of the button
document.getElementById("equationBtn").addEventListener("click", () => {
    // Hide main content
    document.getElementById("mainContent").classList.add("hidden");

    // Update subcategory title and show subcategory content
    document.getElementById("Equations_Subtitle").innerText = "Equation Subcategories";
    document.getElementById("equations_sub_div").classList.remove("hidden");
});

// add logic buttons for subcategories
// Subcategory button logic
document.getElementById("eq_typo").addEventListener("click", () => {
    alert("You clicked on the subcategory for typos");
});



// Back button logic
document.getElementById("backBtn").addEventListener("click", () => {
    // Hide subcategory content
    document.getElementById("equations_sub_div").classList.add("hidden");

    // Show main content
    document.getElementById("mainContent").classList.remove("hidden");
});