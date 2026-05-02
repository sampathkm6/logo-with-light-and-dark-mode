// ===== Blog Categories Design =====

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const textInput = document.getElementById("textInput");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");

// Load assets
let imagesLoaded = 0;
const brandLogo = new Image();
brandLogo.src = "logo.svg";
brandLogo.onload = draw;

const bgTemplate = new Image();
bgTemplate.src = "bg-template.png";
bgTemplate.onload = draw;

// State
let localSelectedSocialColor = null;
// We don't strictly need the icon for this new design based on the reference image, 
// but we keep the logic in case we want to use it later or if the user asks for it.
let currentSocialIconImage = null;

// Init Shared
Shared.init({
    socialSearchInputId: "socialSearch",
    socialResultsListId: "socialResults",
    onSocialSelect: (item) => {
        localSelectedSocialColor = item;
        // For this design, we might not use the icon, but let's load it just in case logic is needed
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

document.fonts.ready.then(() => {
    draw();
});

downloadBtn.addEventListener("click", () => {
    const text = textInput.value || "Category Name";
    const bgColor = getBgColor();
    const socialSlug = localSelectedSocialColor ? localSelectedSocialColor.slug : "blog-category";
    const customFilename = filenameInput.value;
    Shared.downloadAndSave(canvas, text, bgColor, socialSlug, statusEl, "blog-categories", customFilename);
});

// Helpers
function getBgColor() {
    return localSelectedSocialColor && localSelectedSocialColor.color ? localSelectedSocialColor.color : "#ffffff";
}

function getGradient() {
    return localSelectedSocialColor ? localSelectedSocialColor.gradient : null;
}

// Drawing Logic
function draw() {
    const text = (textInput.value || "Category Name").toUpperCase();
    const bgColor = getBgColor();
    const gradient = getGradient();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background (Full Gradient)
    if (gradient) {
        let colors = [];
        const hexRegex = /#(?:[0-9a-fA-F]{3,8})/g;
        const matches = gradient.match(hexRegex);
        if (matches) colors = matches;
        else colors = gradient.split(',').map(c => c.trim());

        // Create a linear gradient from top-left to bottom-right or just horizontal
        // Reference image looks like a nice diagonal or horizontal blend. Let's try diagonal.
        const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

        if (colors.length >= 2) {
            // Distribute colors evenly
            colors.forEach((col, i) => {
                grd.addColorStop(i / (colors.length - 1), col);
            });
        } else if (colors.length === 1) {
            grd.addColorStop(0, colors[0]);
            grd.addColorStop(1, colors[0]);
        } else {
            grd.addColorStop(0, bgColor);
            grd.addColorStop(1, bgColor);
        }
        ctx.fillStyle = grd;
    } else {
        ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. "BLOG" Watermark (Image)
    if (bgTemplate.complete && bgTemplate.naturalWidth > 0) {
        ctx.save();
        // Assuming the image is transparent white text or similar. 
        // We might want to adjust opacity if it's too strong, but let's start with 100% or user intention.
        // If it's a "watermark", it implies some transparency. 
        // Previous code used 0.05 opacity for text. IF the png is solid, we need low opacity.
        // Let's assume the PNG is prepared properly or apply a safe low opacity just in case it's not.
        // However, if the user says "use bg-template.png", they might have styled it. 
        // But to be safe for a "watermark background", let's apply partial transparency or blending.
        // Actually, let's keep it simple first. The user's image shows it as very faint.
        // I will apply globalAlpha to be safe, or if it's already transparent, it will accumulate.
        // Let's use a blending mode or simply draw it.
        // Let's try drawing it stretched to fill the canvas.

        // ctx.globalAlpha = 0.3; // Just a guess, maybe remove if it's too light.
        ctx.drawImage(bgTemplate, 0, 0, canvas.width, canvas.height);
        // ctx.globalAlpha = 1.0;
        ctx.restore();
    } else {
        // Fallback if image fails or not loaded yet? 
        // Maybe keep the text as fallback? Or just nothing.
        // I'll leave it empty to avoid clutter if image is missing.
    }

    // 3. Main Text (Category Name) with fitting
    const fontFamily = "Avenir Next";
    const fontWeight = "600";
    const maxFontSize = 68; // Kept large for blog categories
    const minFontSize = 30;
    const textBoxWidth = 700; // Wide enough for 800px width canvas
    const textBoxHeight = 200;
    const centerY = canvas.height / 2;
    const centerX = canvas.width / 2;

    const fitted = getFittedFontSize(
        ctx,
        text,
        fontFamily,
        fontWeight,
        textBoxWidth,
        textBoxHeight,
        maxFontSize,
        minFontSize
    );

    ctx.font = `${fontWeight} ${fitted.size}px '${fontFamily}', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // We'll adjust Y manually for lines

    // No shadow for main text
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const totalHeight = fitted.lines.length * fitted.lineHeight;
    // Start Y is center minus half height, plus half line height to center the first baseline roughly (simplification)
    // Actually, textBaseline middle means we just need to distribute around center.
    // Let's use alphabetic baseline and calculate.
    // Or keep textBaseline middle and offset.

    // Let's stick to the logic from script.js roughly but adapted for center alignment
    let y = centerY - totalHeight / 2 + fitted.lineHeight / 2;

    fitted.lines.forEach(line => {
        ctx.fillText(line, centerX, y);
        y += fitted.lineHeight;
    });

    // Reset shadow
    ctx.shadowColor = "transparent";

    // 4. Footer Logo (Media Mister)
    if (brandLogo.complete && brandLogo.naturalWidth > 0) {
        const logoWidth = 160;
        const logoHeight = (brandLogo.naturalHeight / brandLogo.naturalWidth) * logoWidth;

        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = canvas.height - logoHeight - 30; // Add bottom padding
        ctx.drawImage(brandLogo, logoX, logoY, logoWidth, logoHeight);
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
