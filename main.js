const canvas = document.getElementById('burger-canvas');
const context = canvas.getContext('2d');

const frameCount = 240;
const frameFolders = [
    'ezgif-31981f8e3c1ad0ef-jpg'
];
const framePathCandidates = ['/dist/frames'];
const frameExtensions = ['jpg', 'jpeg', 'png'];
let activeFrameBasePath = '';
const frameBaseName = (index) => `ezgif-frame-${index.toString().padStart(3, '0')}`;
const frameUrls = (index) => {
    const baseName = frameBaseName(index);
    const urls = [];
    for (const basePath of framePathCandidates) {
        for (const folder of frameFolders) {
            for (const ext of frameExtensions) {
                urls.push(`${basePath}/${folder}/${baseName}.${ext}`);
            }
        }
    }
    return urls;
};

// Preloading images
const images = [];
const burger = {
    frame: 0,
    targetFrame: 0
};
let lastRenderableImage = null;

function preloadImages() {
    let completedImages = 0;

    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const candidates = frameUrls(i);
        let candidateIndex = 0;

        const tryNextPath = () => {
            if (candidateIndex >= candidates.length) {
                completedImages++;
                return;
            }

            const nextUrl = candidates[candidateIndex];
            candidateIndex++;
            img.src = nextUrl;
        };

        img.onload = () => {
            completedImages++;
            if (!activeFrameBasePath && candidateIndex > 0) {
                const matched = candidates[candidateIndex - 1];
                const matchedFolder = frameFolders.find((folder) => matched.includes(`/${folder}/`));
                if (matchedFolder) {
                    activeFrameBasePath = matched.split(`/${matchedFolder}/`)[0];
                }
            }
            if (!lastRenderableImage) {
                lastRenderableImage = img;
                renderBurger();
            }
            if (completedImages === frameCount) {
                console.log(`Frame preload complete. Active path: ${activeFrameBasePath || 'none'}`);
            }
        };
        img.onerror = tryNextPath;
        tryNextPath();
        images.push(img);
    }
}

// Set canvas dimensions
function resizeCanvas() {
    // High DPI support based on actual rendered canvas size.
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
    context.setTransform(scale, 0, 0, scale, 0, 0);
    renderBurger();
}

window.addEventListener('resize', resizeCanvas);

// Scroll Handling - Localized to Bento Section
const bentoSection = document.querySelector('.bento-section');

function updateScroll() {
    if (!bentoSection) return;

    const rect = bentoSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate progress based on when the section enters from bottom to when it leaves top
    // Start animation when section top is at 80% of window height
    // End animation when section bottom is at 20% of window height
    const startOffset = windowHeight * 0.8;
    const endOffset = windowHeight * 0.2;
    
    const progressStart = rect.top - startOffset;
    const scrollRange = rect.height + startOffset - endOffset;
    
    let scrollFraction = -progressStart / scrollRange;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    // Map to burger frames
    burger.frame = scrollFraction * (frameCount - 1);
    burger.targetFrame = burger.frame;
    renderBurger();
}

let scrollTicking = false;
let isSectionVisible = false;

// Optimization: Only listen to scroll if section is in view
const observer = new IntersectionObserver((entries) => {
    isSectionVisible = entries[0].isIntersecting;
}, { threshold: 0 });

if (bentoSection) observer.observe(bentoSection);

window.addEventListener('scroll', () => {
    if (!isSectionVisible || scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
        updateScroll();
        scrollTicking = false;
    });
}, { passive: true });

function renderBurger() {
    const frameIndex = Math.round(burger.frame);
    const img = images[frameIndex];
    const scale = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / scale;
    const canvasHeight = canvas.height / scale;

    const frameToDraw = (img && img.complete && img.naturalWidth > 0) ? img : lastRenderableImage;

    if (frameToDraw && frameToDraw.complete && frameToDraw.naturalWidth > 0) {
        lastRenderableImage = frameToDraw;
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Fit image into a target viewport zone with mobile-first tuning.
        const isMobile = window.innerWidth <= 768;
        const maxWidth = canvasWidth * (isMobile ? 1.0 : 0.98); // Edge-to-edge on mobile
        const maxHeight = canvasHeight * (isMobile ? 0.98 : 0.96);
        const fitScale = Math.min(maxWidth / frameToDraw.width, maxHeight / frameToDraw.height);
        const scaleBoost = isMobile ? 1.55 : 1; // High boost for 'Max Fit'
        const drawWidth = frameToDraw.width * fitScale * scaleBoost;
        const drawHeight = frameToDraw.height * fitScale * scaleBoost;

        const x = (canvasWidth - drawWidth) / 2;
        let y = (canvasHeight - drawHeight) / 2;
        
        if (isMobile) {
            // Shift the burger up to compensate for 'Max Fit' scale pushing it off bottom
            y -= drawHeight * 0.15; 
        }

        context.drawImage(frameToDraw, x, y, drawWidth, drawHeight);
        
        // Hide Veo watermark with a black rectangle
        context.fillStyle = '#000000';
        // The watermark is typically in the bottom right of the drawn image
        context.fillRect(x + drawWidth - 150, y + drawHeight - 80, 150, 80);
    } else {
        // Show fallback only if no frame has ever loaded.
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.fillStyle = '#ff9500';
        context.font = '20px Outfit';
        context.textAlign = 'center';
        context.fillText('Frames not found. Checked JPG/JPEG/PNG paths.', canvasWidth / 2, canvasHeight / 2);
    }
}

// Initial calls
preloadImages();
resizeCanvas();
updateScroll();
renderBurger();

