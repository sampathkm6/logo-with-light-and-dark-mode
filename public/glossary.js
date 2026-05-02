// ===== Glossary Design =====

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");

// Load assets
let imagesLoaded = 0;
const bgImage = new Image();
bgImage.src = "glossary-background.jpg";
bgImage.onload = draw;

const brandLogo = new Image();
brandLogo.src = "logo.svg";
brandLogo.onload = draw;

// Events
textInput.addEventListener("input", draw);

document.fonts.ready.then(() => {
    draw();
});

downloadBtn.addEventListener("click", () => {
    const text = textInput.value || "Watch Time Hours";
    const bgColor = "#000000";
    const socialSlug = "glossary";
    const customFilename = filenameInput.value;
    Shared.downloadAndSave(canvas, text, bgColor, socialSlug, statusEl, "glossary", customFilename);
});

// Drawing Logic
function draw() {
    const mainText = textInput.value || "Watch Time Hours";

    // Background
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback
        ctx.fillStyle = "#3b55e6"; // Blueish fallback from screenshot
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Content Block
    // Design: 
    // Small vertical rect | "Social Media Glossary"
    // "Main Text" (Large, Bold, Multi-line)

    // Config
    const startX = 50; // Left padding
    // We need to vertically center the whole block.
    // Let's first calculate height of the block.

    const titleFontSize = 24;
    const mainFontSize = 70; // Large
    const titleFont = "400 " + titleFontSize + "px 'Segoe UI', Roboto, sans-serif";
    const mainFont = "700 " + mainFontSize + "px 'Segoe UI', Roboto, sans-serif";

    const rectWidth = 6;
    const rectHeight = 24; // Match title height approx
    const titleGap = 15; // Gap between rect and title
    const verticalGap = 20; // Gap between Title line and Main Text

    // 2. Draw Main Text
    const fontFamily = "Avenir Next";
    const fontWeight = "800";
    const maxFontSize = 52;
    const minFontSize = 25;
    const maxWidth = 450;
    const maxHeight = 250; // ample height

    const fitted = getFittedFontSize(ctx, mainText, fontFamily, fontWeight, maxWidth, maxHeight, maxFontSize, minFontSize);

    ctx.font = `${fontWeight} ${fitted.size}px '${fontFamily}', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    ctx.letterSpacing = "1px";

    // Recalculate block height with fitted lines
    const mainLineHeight = fitted.lineHeight;
    const totalMainTextHeight = fitted.lines.length * mainLineHeight;
    const blockHeight = Math.max(rectHeight, titleFontSize * 1.2) + verticalGap + totalMainTextHeight;

    // Recalculate Center Y
    let currentY = (canvas.height - blockHeight) / 2;

    // Redraw Title Header at new Y
    const titleY = currentY;
    ctx.fillStyle = "#a8b1ff";
    ctx.fillRect(startX, titleY + (titleFontSize * 1.2 - rectHeight) / 2 - 2, rectWidth, rectHeight);

    ctx.font = titleFont;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Social Media Glossary", startX + rectWidth + titleGap, titleY);

    currentY += Math.max(rectHeight, titleFontSize * 1.2) + verticalGap;

    // Draw Fitted Main Text
    ctx.font = `${fontWeight} ${fitted.size}px '${fontFamily}', sans-serif`;
    ctx.fillStyle = "#ffffff";

    fitted.lines.forEach(line => {
        ctx.fillText(line, startX, currentY);
        currentY += mainLineHeight;
    });

    // 3. Logo (Bottom Left)
    if (brandLogo.complete && brandLogo.naturalWidth > 0) {
        const logoWidth = 160;
        const logoHeight = (brandLogo.naturalHeight / brandLogo.naturalWidth) * logoWidth;

        const logoX = startX;
        const logoY = canvas.height - logoHeight - 40; // 40px padding bottom

        ctx.drawImage(brandLogo, logoX, logoY, logoWidth, logoHeight);
    }
}

// Helper functions (Added)

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

function getFittedFontSize(ctx, text, fontFamily, fontWeight, maxWidth, maxHeight, maxSize, minSize) {
    let size = maxSize;

    while (size >= minSize) {
        ctx.font = `${fontWeight} ${size}px '${fontFamily}', sans-serif`;
        const lineHeight = size * 1.1;
        const lines = getWrappedLines(ctx, text, maxWidth);
        const totalHeight = lines.length * lineHeight;

        if (totalHeight <= maxHeight) {
            return { size, lineHeight, lines };
        }

        size -= 2;
    }

    ctx.font = `${fontWeight} ${minSize}px '${fontFamily}', sans-serif`;
    const lineHeight = minSize * 1.1;
    const lines = getWrappedLines(ctx, text, maxWidth);
    return { size: minSize, lineHeight, lines };
}
