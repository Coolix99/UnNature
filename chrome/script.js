


if (window.location.href) {
    // Display an alert with the current URL of the tab
    alert(`This page has the following URL: ${window.location.href}`);
}



// if (window.location.href) {
//     // Display an alert with the current URL of the tab

//     alert('csv is being read');
//     const data = readCSVFile();
//     alert('csv has been read');
//     console.log("does not work");

//     // TODO:
//     // here should be a logic that loads the file with all comments and then
//     // compares the current page URL with the URL from the file
//     // if the URLs match, the comment from the file should
//     // be displayed as an alert to tell the user that there is a comment for this 
//     // page available

//     // alert(`This page has the following URL: ${window.location.href}`);
// }




// // Function to parse CSV content into an array of objects
// function parseCSV(content) {
//     const lines = content.split("\n");
//     const headers = lines[0].split(",");  // First row is header
//     const data = [];

//     console.log("headers ", headers);
//     console.log("lines ", lines);

//     // Loop through each row and create an object for each entry
//     for (let i = 1; i < lines.length; i++) {
//         const cells = lines[i].split(",");
//         if (cells.length === headers.length) {
//             const entry = {};
//             for (let j = 0; j < headers.length; j++) {
//                 entry[headers[j].trim()] = cells[j].trim();
//             }
//             data.push(entry);
//         }
//     }
//     return data;
// }




// // Function to read and parse the CSV file
// async function readCSVFile() {
//     const filePath = "/home/eric/Downloads/current_url.csv"; //here it would need a path to a server
//     // because local files are not accessible from the browser, they get blocked

//     try {
//         const response = await fetch(`file://${filePath}`);
//         if (!response.ok) {
//             throw new Error(`Failed to fetch file: ${response.statusText}`);
//         }

//         // Read the CSV file content
//         const fileContent = await response.text();
//         return fileContent;
//     } catch (error) {
//         console.error("Error reading file:", error);
//     }
// }

