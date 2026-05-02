// ===== Tools Design =====

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");
const subTextInput = document.getElementById("subTextInput");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");

// Assets
const logoImage = new Image();
logoImage.src = "logo.svg";
let logoLoaded = false;
logoImage.onload = () => {
    logoLoaded = true;
    draw();
};

// State
let localSelectedSocialColor = null;
let currentSocialIconImage = null;

// Init Shared
Shared.init({
    socialSearchInputId: "socialSearch",
    socialResultsListId: "socialResults",
    onSocialSelect: (item) => {
        localSelectedSocialColor = item;
        if (item.icon) {
            currentSocialIconImage = new Image();
            currentSocialIconImage.src = item.icon;
            currentSocialIconImage.onload = draw;
        } else {
            currentSocialIconImage = null;
            draw();
        }
    }
});
Shared.fetchSocialColors("");

// Events
textInput.addEventListener("input", draw);
subTextInput.addEventListener("input", draw);
// Trigger draw on font load
document.fonts.ready.then(draw);


downloadBtn.addEventListener("click", () => {
    const text = textInput.value || "Tool Name";
    const bgColor = localSelectedSocialColor ? localSelectedSocialColor.color : "#111";
    const socialSlug = localSelectedSocialColor ? localSelectedSocialColor.slug : "tool";
    const customFilename = filenameInput.value;
    Shared.downloadAndSave(canvas, text, bgColor, socialSlug, statusEl, null, customFilename);
});


// Drawing Logic
function draw() {
    const text = textInput.value || "YouTube Video";
    const subText = subTextInput.value || "Downloader";

    // Colors
    // If no social color selected, use a default gradient or dark color
    const baseColor = localSelectedSocialColor ? localSelectedSocialColor.color : "#d6249f"; // Default pinkish if nothing
    const gradient = localSelectedSocialColor ? localSelectedSocialColor.gradient : null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background
    // Logic: Use gradient if available, else plain color
    if (gradient) {
        let colors = [];
        const hexRegex = /#(?:[0-9a-fA-F]{3,8})/g;
        const matches = gradient.match(hexRegex);
        if (matches) colors = matches;
        else colors = gradient.split(',').map(c => c.trim());

        try {
            // Diagonal gradient for background
            const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            if (colors.length >= 2) {
                colors.forEach((c, i) => {
                    grd.addColorStop(i / (colors.length - 1), c);
                });
            } else if (colors[0]) {
                grd.addColorStop(0, colors[0]);
                grd.addColorStop(1, colors[0]);
            }
            ctx.fillStyle = grd;
        } catch (e) { ctx.fillStyle = baseColor; }
    } else {
        ctx.fillStyle = baseColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 2. Social Icon (Top Center)
    const iconSize = 120;
    const iconY = 55; // Moved up from 80 to give more text space
    if (currentSocialIconImage && currentSocialIconImage.complete) {
        ctx.drawImage(currentSocialIconImage, centerX - iconSize / 2, iconY, iconSize, iconSize);
    }

    // 3. Horizontal Line
    const lineY = 205; // Moved up relative to icon
    const lineWidth = 400;

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.moveTo(centerX - lineWidth / 2, lineY);
    ctx.lineTo(centerX + lineWidth / 2, lineY);
    ctx.stroke();


    // 4 & 5. Text Block (Title + Subtitle)

    // Constraints
    const maxTitleWidth = 700;
    const maxTitleHeight = 120;
    const maxSubWidth = 650;
    const maxSubHeight = 80;

    // Avenir Next fonts
    const fittedTitle = getFittedFontSize(ctx, text.toUpperCase(), "Avenir Next", "900", maxTitleWidth, maxTitleHeight, 60, 30, true);
    const fittedSub = getFittedFontSize(ctx, subText.toUpperCase(), "Avenir Next", "300", maxSubWidth, maxSubHeight, 42, 20, true);

    // Calculate total height of the text block
    const titleH = fittedTitle.lines.length * fittedTitle.lineHeight;
    const subH = fittedSub.lines.length * fittedSub.lineHeight;
    const textGap = 5;
    const totalTextBlockHeight = titleH + textGap + subH;

    // Available vertical space definition
    // Top boundary: Line Y (205) + padding (e.g. 20) = 225
    // Bottom boundary: Logo Top (approx 380) - padding (10) = 370
    // Center point of available space: (225 + 370) / 2 = 297.5 (~300)
    const availableCenterY = 295;

    // Start Y for the block to be centered
    let currentY = availableCenterY - (totalTextBlockHeight / 2) + (fittedTitle.lineHeight / 2); // Baseline adjustment for first line roughly

    // Draw Title
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.font = `900 ${fittedTitle.size}px 'Avenir Next', sans-serif`;

    fittedTitle.lines.forEach((line, i) => {
        // Adjust for baseline: fillText draws at baseline. 
        // A simple approximation is shifting down by 1/3 of text height or just using currentY as roughly baseline for first line?
        // Let's assume currentY is the top of the block. Add approx baseline offset (e.g. size * 0.8)
        // OR better: use textBaseline = 'top' or 'middle'.
        // Let's stick to default baseline and add offset.
        // If currentY is "Top" of the block:
        ctx.fillText(line, centerX, currentY + i * fittedTitle.lineHeight + (fittedTitle.size * 0.35));
        // 0.35 shift helps center somewhat if we assume Y is center, but here we calculated Top.
    });

    // Draw Subtitle
    // Update Y to start of subtitle
    currentY += titleH + textGap;

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = `300 ${fittedSub.size}px 'Avenir Next', sans-serif`;

    fittedSub.lines.forEach((line, i) => {
        ctx.fillText(line, centerX, currentY + i * fittedSub.lineHeight + (fittedSub.size * 0.35));
    });


    // 6. Branding Logo (Bottom)
    if (logoLoaded) {
        const logoWidth = 150;
        const ratio = logoImage.height / logoImage.width;
        const logoHeight = logoWidth * ratio;
        // Fix position from bottom
        const logoY = canvas.height - 60;

        ctx.drawImage(logoImage, centerX - logoWidth / 2, logoY, logoWidth, logoHeight);
    }
}


// --- Text Utilities ---

function getWrappedLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = line + word + " ";
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth) {
            if (line.trim() !== "") {
                lines.push(line.trim());
                line = "";
            }
            const singleWordWidth = ctx.measureText(word).width;
            if (singleWordWidth > maxWidth) {
                // Break long word
                let currentWordPart = "";
                for (let j = 0; j < word.length; j++) {
                    const char = word[j];
                    if (ctx.measureText(currentWordPart + char).width > maxWidth) {
                        if (currentWordPart !== "") {
                            lines.push(currentWordPart);
                        }
                        currentWordPart = char;
                    } else {
                        currentWordPart += char;
                    }
                }
                line = currentWordPart + " ";
            } else {
                line = word + " ";
            }
        } else {
            line = testLine;
        }
    }
    if (line.trim() !== "") {
        lines.push(line.trim());
    }
    return lines;
}

function getFittedFontSize(ctx, text, fontFamily, fontWeight, maxWidth, maxHeight, maxSize, minSize, forceSingleLine = false) {
    let size = maxSize;

    while (size >= minSize) {
        ctx.font = `${fontWeight} ${size}px '${fontFamily}', sans-serif`;
        const lineHeight = size * 1.1;

        if (forceSingleLine) {
            const metrics = ctx.measureText(text);
            if (metrics.width <= maxWidth) {
                return { size, lineHeight, lines: [text] };
            }
        } else {
            const lines = getWrappedLines(ctx, text, maxWidth);
            const totalHeight = lines.length * lineHeight;
            if (totalHeight <= maxHeight) {
                return { size, lineHeight, lines };
            }
        }

        size -= 2;
    }

    ctx.font = `${fontWeight} ${minSize}px '${fontFamily}', sans-serif`;
    const lineHeight = minSize * 1.1;
    const lines = forceSingleLine ? [text] : getWrappedLines(ctx, text, maxWidth);
    return { size: minSize, lineHeight, lines };
}
