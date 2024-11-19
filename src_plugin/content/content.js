if (document.location.href.startsWith("https://de.wikipedia.org/wiki/Jesus_von_Nazaret")) {
    const popupDiv = document.createElement("div");
    popupDiv.style.position = "fixed";
    popupDiv.style.top = "10%";
    popupDiv.style.left = "50%";
    popupDiv.style.transform = "translate(-50%, -50%)";
    popupDiv.style.backgroundColor = "white";
    popupDiv.style.border = "1px solid black";
    popupDiv.style.padding = "20px";
    popupDiv.style.zIndex = "10000";
    popupDiv.innerHTML = `
        <h2>Welcome to Example.com!</h2>
        <p>This is a custom popup message.</p>
        <button id="close-popup">Close</button>
    `;

    document.body.appendChild(popupDiv);

    document.getElementById("close-popup").addEventListener("click", () => {
        popupDiv.remove();
    });
}
