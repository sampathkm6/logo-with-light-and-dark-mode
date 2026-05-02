// ===== basic setup =====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// State specific to this visual template
let currentSocialIconImage = null;

const textInput = document.getElementById("textInput");
const filenameInput = document.getElementById("filenameInput");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");
const templateRadios = document.querySelectorAll('input[name="templateRegion"]');

// Load images
let imagesLoaded = 0;
const bgImage = new Image();
bgImage.src = "bg-template.png";

const logoImage = new Image();
logoImage.src = "logo.svg";

bgImage.onload = onImageLoad;
logoImage.onload = onImageLoad;

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 2) {
    statusEl.textContent = "Images loaded. You can generate now.";
    drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
  }
}

// Region footer texts (Specific to Service Page Design)
const regionFooterTexts = {
  "EN": "Trusted Seller   •   Secure Payments   •   Live Chat Support",
  "IT": "Venditore Affidabile   •   Pagamenti Sicuri   •   Supporto live chat",
  "FR": "Vendeur de confiance   •   Paiements sécurisés   •   Assistance par chat en direct",
  "DE": "Vertrauenswürdiger Verkäufer   •   Sichere Zahlungen   •   Live Chat Support",
  "ES": "Vendedor confiable   •   Pagos seguros   •   Soporte de chat en vivo",
  "PT-BR": "Vendedor confiável   •   Pagamentos Seguros   •   Suporte para chat ao vivo",
  "AR": "دعم الدردشة المباشرة  •   مدفوعات آمنة   •   بائع موثوق"
};

// --- Initialization ---

// Initialize Shared Library for Search
Shared.init({
  socialSearchInputId: "socialSearch",
  socialResultsListId: "socialResults",
  onSocialSelect: (item) => {
    // When a social item is selected
    if (item.icon) {
      currentSocialIconImage = new Image();
      currentSocialIconImage.src = item.icon;
      currentSocialIconImage.onload = () => drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
    } else {
      currentSocialIconImage = null;
      drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
    }
  }
});

// Load default list
Shared.fetchSocialColors("");


// --- Event Listeners ---

document.fonts.ready.then(() => {
  console.log("Fonts loaded");
  drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
});

textInput.addEventListener("input", () => {
  drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
});

templateRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
  });
});

downloadBtn.addEventListener("click", () => {
  // get selected item from shared state is a bit tricky since we track it there, 
  // but the drawing relies on `getCurrentBgColor` which pulls from `Shared.selectedSocialColor`? 
  // Actually `selectedSocialColor` is local in the old script. 
  // We need to access the selected item. 
  // Let's rely on the variables passed to drawTemplate or get them from DOM/State.

  // However, Shared.js doesn't expose the selected item directly as a property we can read easily 
  // unless we modified it. But we passed `onSocialSelect` which updates our local visual state.
  // Wait, `getCurrentBgColor` needs the color.

  // We need a way to store the selected color locally in this script too, or access it from Shared.
  // For now, let's update `onSocialSelect` to store it locally.
  const text = getCurrentText();
  const bgColor = getCurrentBgColor();
  const socialSlug = localSelectedSocialColor ? localSelectedSocialColor.slug : "image"; // We need this
  const customFilename = filenameInput.value;

  Shared.downloadAndSave(canvas, text, bgColor, socialSlug, statusEl, null, customFilename);
});


// --- State Getters ---

let localSelectedSocialColor = null; // We'll keep a local copy for drawing needs

// Hook into the init callback to update this
Shared.init({
  socialSearchInputId: "socialSearch",
  socialResultsListId: "socialResults",
  onSocialSelect: (item) => {
    localSelectedSocialColor = item;

    if (item.icon) {
      currentSocialIconImage = new Image();
      currentSocialIconImage.src = item.icon;
      currentSocialIconImage.onload = () => drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
    } else {
      currentSocialIconImage = null;
      drawTemplate(getCurrentText(), getCurrentBgColor(), getCurrentGradient());
    }
  }
});


function getCurrentText() {
  return textInput.value || "BUY ANDROID APP INSTALLS";
}

function getCurrentBgColor() {
  if (localSelectedSocialColor && localSelectedSocialColor.color) {
    return localSelectedSocialColor.color;
  }
  return "#000000";
}

function getCurrentGradient() {
  if (localSelectedSocialColor) {
    return localSelectedSocialColor.gradient;
  }
  return null;
}

function getCurrentTemplate() {
  const checked = document.querySelector('input[name="templateRegion"]:checked');
  return checked ? checked.value : "EN";
}

// --- Drawing Logic (Service Page Specific) ---

function drawTemplate(text, bgColor, gradient) {
  if (imagesLoaded < 2) {
    statusEl.textContent = "Please wait, images are still loading...";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. fill background
  const currentTemplate = getCurrentTemplate();
  ctx.direction = (currentTemplate === 'AR') ? 'rtl' : 'ltr';

  ctx.fillStyle = bgColor;

  if (gradient) {
    let colors = [];
    const hexRegex = /#(?:[0-9a-fA-F]{3,8})/g;
    const matches = gradient.match(hexRegex);

    if (matches && matches.length > 0) {
      colors = matches;
    } else {
      colors = gradient.split(',').map(c => c.trim()).filter(c => c !== "");
      colors = colors.map(c => c.replace(/linear-gradient\(.*?,/gi, '').replace(/\)/g, '').trim());
    }
    if (colors.length > 1) {
      try {
        const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        colors.forEach((color, index) => {
          grd.addColorStop(index / (colors.length - 1), color);
        });
        ctx.fillStyle = grd;
      } catch (e) {
        if (colors[0]) ctx.fillStyle = colors[0];
      }
    } else if (colors.length === 1 && colors[0]) {
      ctx.fillStyle = colors[0];
    }
  }

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. logo
  const logoWidth = 140;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
  ctx.drawImage(logoImage, 330, 400, logoWidth, logoHeight);


  // 4. social icon
  const centerX = canvas.width / 2;
  if (currentSocialIconImage && currentSocialIconImage.complete) {
    ctx.shadowColor = "#00000040";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 10;

    const iconHeight = 110;
    const iconWidth = (currentSocialIconImage.width / currentSocialIconImage.height) * iconHeight;
    const iconY = canvas.height - 400;

    ctx.drawImage(
      currentSocialIconImage,
      centerX - iconWidth / 2,
      iconY,
      iconWidth,
      iconHeight
    );

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // 5. main text 
  const fontFamily = "Avenir Next";
  const fontWeight = "800";
  const maxFontSize = 52;
  const minFontSize = 25;
  const textBoxWidth = 600;
  const textBoxHeight = 150;
  const centerY = canvas.height - 205;

  const fitted = getFittedFontSize(
    ctx,
    text || "Default Text",
    fontFamily,
    fontWeight,
    textBoxWidth,
    textBoxHeight,
    maxFontSize,
    minFontSize
  );

  ctx.font = `${fontWeight} ${fitted.size}px '${fontFamily}', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";

  ctx.shadowColor = "#00000040";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;

  const totalHeight = fitted.lines.length * fitted.lineHeight;
  let y = centerY - totalHeight / 2 + fitted.lineHeight / 2;

  fitted.lines.forEach(line => {
    ctx.fillText(line, centerX, y);
    y += fitted.lineHeight;
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.letterSpacing = "0px";


  // 6. Footer Text & Dynamic Lines
  const currentTemplateRegion = getCurrentTemplate();
  const rawSmallText = regionFooterTexts[currentTemplateRegion] || regionFooterTexts["EN"];
  const smallText = rawSmallText ? rawSmallText.toUpperCase() : "";

  if (smallText) {
    let footerFontSize = 16;
    if (currentTemplateRegion === "FR" || currentTemplateRegion === "PT-BR") {
      footerFontSize = 14;
    } else if (currentTemplateRegion === "DE") {
      footerFontSize = 15;
    }
    ctx.font = `600 ${footerFontSize}px 'Avenir Next', sans-serif`;
    ctx.letterSpacing = "0.5px";

    const textMetrics = ctx.measureText(smallText);
    const textWidth = textMetrics.width;
    const footerLineWidth = textWidth;

    const startX = centerX - footerLineWidth / 2;
    const endX = centerX + footerLineWidth / 2;

    ctx.beginPath();
    ctx.moveTo(startX, 340);
    ctx.lineTo(endX, 340);
    ctx.moveTo(startX, 380);
    ctx.lineTo(endX, 380);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(smallText, centerX, 360);
    ctx.letterSpacing = "0px";
  }
}

// --- Text Utilities (Directly from original script) ---

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y);
}

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
