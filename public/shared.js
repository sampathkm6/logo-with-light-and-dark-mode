// ===== shared.js =====
// Contains common logic for social search, API interaction, and file saving/downloading.

const API_BASE = "../api";

// --- State ---
let currentItems = [];
let highlightedIndex = -1;
let selectedSocialColor = null;

// --- DOM Elements references (to be set by init) ---
let elements = {};

/**
 * Initialize shared functionality.
 * @param {Object} config - {
 *   socialSearchInputId: string,
 *   socialResultsListId: string,
 *   onSocialSelect: function(item), // Callback when a social item is selected
 *   onError: function(msg)
 * }
 */
function initShared(config) {
    elements.socialSearchInput = document.getElementById(config.socialSearchInputId);
    elements.socialResultsList = document.getElementById(config.socialResultsListId);
    elements.onSocialSelect = config.onSocialSelect;
    elements.onError = config.onError || console.error;

    if (elements.socialSearchInput && elements.socialResultsList) {
        setupSocialSearch();
    }
}

// --- Social Search Logic ---

function setupSocialSearch() {
    let searchTimeout = null;
    const input = elements.socialSearchInput;
    const results = elements.socialResultsList;

    input.addEventListener("input", () => {
        const term = input.value.trim();

        if (!term) {
            results.style.display = "none";
            results.innerHTML = "";
            return;
        }

        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchSocialColors(term);
        }, 200);
    });

    input.addEventListener("keydown", (e) => {
        const listItems = results.querySelectorAll("li");

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (highlightedIndex < listItems.length - 1) {
                highlightedIndex++;
                updateHighlightedItem(listItems);
            }
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (highlightedIndex > 0) {
                highlightedIndex--;
                updateHighlightedItem(listItems);
            }
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0) {
                selectDropdownItem(highlightedIndex);
            }
        }

        if (e.key === "Escape") {
            results.style.display = "none";
        }
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
        if (!elements.socialSearchInput.contains(e.target) && !results.contains(e.target)) {
            results.style.display = "none";
        }
    });
}


async function fetchSocialColors(term) {
    try {
        const res = await fetch(`${API_BASE}/social-colors.php?search=${encodeURIComponent(term)}`);
        const data = await res.json();

        if (!data.success) {
            console.error("API error:", data.error);
            return;
        }

        renderSocialResults(data.items);

        // If we just loaded everything (empty term), select the first one
        if (term === "") {
            loadFirstItemAsDefault();
        }

    } catch (e) {
        console.error("Error fetching social colors:", e);
    }
}

function renderSocialResults(items) {
    currentItems = items;
    highlightedIndex = -1;
    const results = elements.socialResultsList;
    results.innerHTML = "";

    if (!items.length) {
        results.style.display = "none";
        return;
    }

    items.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = item.name;
        // Store data attributes for reference if needed
        li.dataset.slug = item.slug;
        li.dataset.color = item.color;
        li.dataset.gradient = item.gradient || "";
        li.dataset.icon = item.icon || "";
        li.dataset.footer_text = item.footer_text || "";

        li.addEventListener("click", () => selectDropdownItem(index));

        results.appendChild(li);
    });

    results.style.display = "block";
}

function updateHighlightedItem(listItems) {
    listItems.forEach((li, i) => {
        li.classList.toggle("highlighted", i === highlightedIndex);
    });

    if (listItems[highlightedIndex]) {
        listItems[highlightedIndex].scrollIntoView({ block: "nearest" });
    }
}

function selectDropdownItem(index) {
    if (index < 0 || index >= currentItems.length) return;

    const item = currentItems[index];

    selectedSocialColor = {
        name: item.name,
        slug: item.slug,
        color: item.color,
        gradient: item.gradient || "",
        icon: item.icon,
        footer_text: item.footer_text || ""
    };

    elements.socialSearchInput.value = item.name;
    elements.socialResultsList.style.display = "none";

    if (elements.onSocialSelect) {
        elements.onSocialSelect(selectedSocialColor);
    }
}

function loadFirstItemAsDefault() {
    if (currentItems.length > 0) {
        selectDropdownItem(0);
    }
}


// --- Saving & Downloading Helpers ---

/**
 * Downscale/Resize and get Data URL
 */
function getResizedDataUrl(sourceCanvas, targetWidth) {
    const originalWidth = sourceCanvas.width;
    const originalHeight = sourceCanvas.height;
    const aspectRatio = originalWidth / originalHeight;
    const targetHeight = targetWidth / aspectRatio;

    const offScreenCanvas = document.createElement("canvas");
    offScreenCanvas.width = targetWidth;
    offScreenCanvas.height = targetHeight;

    const ctx = offScreenCanvas.getContext("2d");
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    return offScreenCanvas.toDataURL("image/jpeg", 1);
}


async function downloadAndSave(canvas, text, bgColor, socialSlug, statusEl, folder = null, customFilename = null) {
    // 1. Prepare Data
    // Get JPEG data URL (100% quality) - RESIZED to 640px width
    const jpegDataUrl = getResizedDataUrl(canvas, 640);

    // Helper to slugify text
    const toSlug = (str) => {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const textSlug = toSlug(text);
    // Use customFilename if valid, else fallback to text slug or social slug
    const finalFilenameSlug = customFilename ? toSlug(customFilename) : (textSlug || socialSlug || "image");

    // 2. Save to Server
    try {
        const res = await fetch(`${API_BASE}/save-image-file.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                bgColor,
                socialSlug,
                customFilename: finalFilenameSlug,
                imageData: jpegDataUrl,
                folder: folder // Optional subfolder
            }),
        });

        const data = await res.json();
        console.log("Server save result:", data);

        if (data.success) {
            statusEl.textContent = "Saved on server as: " + data.filename;
        } else {
            statusEl.textContent = "Server save failed.";
        }
    } catch (err) {
        console.error("Error saving image to server:", err);
        statusEl.textContent = "Network error while saving to server.";
    }

    // 3. Download Locally
    const fileName = `${finalFilenameSlug}.jpg`;
    const link = document.createElement("a");
    link.href = jpegDataUrl;
    link.download = fileName;
    link.click();
}

// Expose globally
window.Shared = {
    init: initShared,
    fetchSocialColors: fetchSocialColors,
    downloadAndSave: downloadAndSave,
    // Utils
    getResizedDataUrl: getResizedDataUrl
};
