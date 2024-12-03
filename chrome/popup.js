// Logic for going to subcategories
// refer to id of the button
document.getElementById("equationBtn").addEventListener("click", () => {
    // Hide main content
    document.getElementById("mainPage").classList.add("hidden");

    // Update subcategory title and show subcategory content
    document.getElementById("Equations_Subtitle").innerText = "Equations";
    document.getElementById("equations_sub_div").classList.remove("hidden");
});

// add logic buttons for subcategories
// Subcategory button logic
// Helper function to reset all subcategory buttons to blue
function resetSubcategoryButtons() {
    // Select all buttons in the subcategory, excluding the "Back" button
    const buttons = document.querySelectorAll("#equations_sub_div .button:not(#backBtn)");
    buttons.forEach((button) => {
        button.style.backgroundColor = "var(--blue)"; // Reset to blue
    });
}

// Helper function to show/hide the "Open Text Window" button
function toggleTextWindowButton(show) {
    const toggleButton = document.getElementById("toggleTextWindowBtn");
    toggleButton.style.display = show ? "block" : "none"; // Show or hide the button
}

// Add event listeners for each subcategory button
document.getElementById("eq_typo").addEventListener("click", (event) => {
    resetSubcategoryButtons(); // Reset all buttons
    event.target.style.backgroundColor = "var(--green)"; // Set the clicked button to green
    toggleTextWindowButton(true); // Show the "Open Text Window" button
    // alert("You clicked on the subcategory for typos");
});

document.getElementById("eq_missing").addEventListener("click", (event) => {
    resetSubcategoryButtons(); // Reset all buttons
    event.target.style.backgroundColor = "var(--green)"; // Set the clicked button to green
    toggleTextWindowButton(true); // Show the "Open Text Window" button
    // alert("You clicked on the subcategory for missing things in equations");
});

document.getElementById("eq_not_clear").addEventListener("click", (event) => {
    resetSubcategoryButtons(); // Reset all buttons
    event.target.style.backgroundColor = "var(--green)"; // Set the clicked button to green
    toggleTextWindowButton(true); // Show the "Open Text Window" button
    // alert("You clicked on the subcategory for something not clear");
});

document.getElementById("eq_no_foundation").addEventListener("click", (event) => {
    resetSubcategoryButtons(); // Reset all buttons
    event.target.style.backgroundColor = "var(--green)"; // Set the clicked button to green
    toggleTextWindowButton(true); // Show the "Open Text Window" button
    // alert("You clicked on the subcategory for no foundation");
});



// toggle text button to  "close text window" in case it is clicked again
const toggleTextWindowBtn = document.getElementById("toggleTextWindowBtn");
const textWindow = document.getElementById("textWindow");


toggleTextWindowBtn.addEventListener("click", () => {
    if (textWindow.classList.contains("hidden")) {
        // Show the text window
        textWindow.classList.remove("hidden");
        toggleTextWindowBtn.textContent = "Close Text Window";
    } else {
        // Hide the text window
        textWindow.classList.add("hidden");
        toggleTextWindowBtn.textContent = "Open Text Window";
    }
});


// Initially hide the "Open Text Window" button
toggleTextWindowButton(false);



// Submit text and download CSV logic
document.getElementById("submitTextBtn").addEventListener("click", async () => {
    const userInput = document.getElementById("userInput").value;

    // Validate input
    if (!userInput.trim()) {
        alert("Please enter some text, if you want :)");
        return;
    }

    // Get the Category from the subtitle (Equations_Subtitle)
    const category = document.getElementById("Equations_Subtitle").innerText;

    // Find the clicked subcategory button
    const activeSubcategory = document.querySelector("#equations_sub_div .button[style*='--green']");
    const subcategory = activeSubcategory ? activeSubcategory.innerText : "Unknown";


    try {
        // Get the current active tab's URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || "URL not available";

        // Create CSV content
        const csvContent = `Category,Subcategory,URL,Text\n"${category}","${subcategory}","${url}","${userInput}"`;

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: "text/csv" });

        // Create a temporary anchor element to trigger the download
        const a = document.createElement("a");
        const csvFilename = `submission_${Date.now()}.csv`; // Unique filename
        a.href = URL.createObjectURL(blob);
        a.download = csvFilename;

        // Trigger the download
        a.click();

        // Clean up the object URL
        URL.revokeObjectURL(a.href);

        // Clear the text area after submission
        document.getElementById("userInput").value = "";

        alert("Your text has been submitted and downloaded as a CSV file!");
    } catch (error) {
        console.error("Error during submission:", error);
        alert("An error occurred while submitting the text. Please try again.");
    }
});


// Back button logic
document.getElementById("backBtn").addEventListener("click", () => {
    // Hide subcategory content
    document.getElementById("equations_sub_div").classList.add("hidden");

    // Show main content
    document.getElementById("mainPage").classList.remove("hidden");
});