(function() {
    if (window.filterToolActive) return;
    window.filterToolActive = true;

    const synonyms = {
        max: "maximum",
        dmg: "damage",
        crit: "critical",
        atk: "attack",
        def: "defense",
        es:  "energy shield",
        lvl: "level"
    };

    function normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .map(word => synonyms[word] || word)
            .join(" ");
    }

    // Create the main container
    const container = document.createElement("div");
    container.style = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #3d3d3d;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
        z-index: 10000;
        font-family: Arial, sans-serif;
        width: 300px;
    `;
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <img src="https://web.poecdn.com/protected/image/trade/layout/logo2.png?key=QoTpbgMmB9GwihOn_t46XQ" 
                style="height: 40px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7)); border-radius: 4px;" 
                onerror="this.style.display='none';">
            <a href="https://buymeacoffee.com/datsavage" target="_blank" 
                style="text-decoration: none; color: #c9aa71; font-size: 12px; font-weight: bold; background: #3d3d3d; padding: 6px 10px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5); transition: all 0.2s;">
                Buy Me a Coffee
            </a>
        </div>
        <input type="text" placeholder="Enter search term..." style="width: 100%; padding: 10px; border: 1px solid #3d3d3d; background: #0a0a0a; color: #c9aa71; font-size: 14px; border-radius: 4px; margin-bottom: 12px; outline: none; box-sizing: border-box;">
        <button style="width: 100%; padding: 10px; background: #c9aa71; color: #000; border: 1px solid #8b733f; cursor: pointer; font-weight: bold; text-transform: uppercase; font-size: 13px; border-radius: 4px; transition: all 0.3s;">
            Search
        </button>
        <div style="background: #3d3d3d; border-radius: 4px; height: 6px; width: 100%; margin-top: 12px; overflow: hidden;">
            <div id="progress-bar" style="height: 100%; width: 0%; background: #c9aa71; transition: width 0.3s;"></div>
        </div>
        <div id="status" style="color: #828282; font-size: 12px; margin-top: 10px; text-align: center; min-height: 20px;">
            Enter a term to search.
        </div>
    `;
    document.body.appendChild(container);

    // Grab elements
    const input = container.querySelector("input");
    const button = container.querySelector("button");
    const status = container.querySelector("#status");
    const progressBar = container.querySelector("#progress-bar");

    async function loadAllItems() {
        let pagesLoaded = 0;
        while (true) {
            const loadMoreButton = document.querySelector(".btn.load-more-btn");
            if (!loadMoreButton) break;
            loadMoreButton.click();
            pagesLoaded++;
            status.textContent = `Loading: ${pagesLoaded} pages loaded...`;
            progressBar.style.width = `${Math.min(100, pagesLoaded * 10)}%`;
            await new Promise(r => setTimeout(r, 1000));
        }
        return pagesLoaded;
    }

    async function filterItems(searchTerm) {
        if (!searchTerm.trim()) {
            status.textContent = "Enter a search term, exile.";
            return;
        }

        const normalizedSearch = normalizeText(searchTerm);
        status.textContent = "Searching through your stash...";
        progressBar.style.width = "50%";

        await loadAllItems();

        const rows = document.querySelectorAll(".row");
        let matches = 0;
        const totalItems = rows.length;

        rows.forEach(row => {
            const itemText = normalizeText(row.innerText);
            const isMatch = itemText.includes(normalizedSearch);
            row.style.display = isMatch ? "" : "none";
            if (isMatch) matches++;
        });

        progressBar.style.width = "100%";
        status.textContent = `Found ${matches} items out of ${totalItems}.`;
    }

    // Event listeners
    button.addEventListener("click", () => filterItems(input.value));
    input.addEventListener("keypress", e => {
        if (e.key === "Enter") filterItems(input.value);
    });
})();
