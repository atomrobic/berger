const canvas = document.getElementById('burger-canvas');
const context = canvas.getContext('2d');

const frameCount = 240;
const frameFolders = [
    'ezgif-2288a3f307e0475d-jpg',
    'ezgif-751c9eb1051126ed-png-split'
];
const framePathCandidates = ['/frames', '/public/frames', 'frames', 'public/frames'];
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

// Scroll Handling
function updateScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const doc = document.documentElement;
    const scrollRange = Math.max(1, doc.scrollHeight - window.innerHeight);
    let scrollFraction = scrollTop / scrollRange;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    // Direct mapping for normal page scroll behavior.
    burger.frame = scrollFraction * (frameCount - 1);
    burger.targetFrame = burger.frame;
    renderBurger();
}

let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (scrollTicking) return;
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
        const maxWidth = canvasWidth * 0.98;
        const maxHeight = canvasHeight * (isMobile ? 0.98 : 0.96);
        const fitScale = Math.min(maxWidth / frameToDraw.width, maxHeight / frameToDraw.height);
        const mobileScaleBoost = isMobile ? 1.5 : 1;
        const drawWidth = frameToDraw.width * fitScale * mobileScaleBoost;
        const drawHeight = frameToDraw.height * fitScale * mobileScaleBoost;

        // Lift burger slightly on mobile for better visual centering.
        const yOffset = isMobile ? -canvasHeight * 0.03 : 0;
        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2 + yOffset;

        context.drawImage(frameToDraw, x, y, drawWidth, drawHeight);
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
