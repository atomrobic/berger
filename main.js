const canvas = document.getElementById('burger-canvas');
const context = canvas.getContext('2d');

const frameCount = 240;
const frameFolder = 'ezgif-751c9eb1051126ed-png-split';
const framePathCandidates = ['/frames', '/public/frames', 'frames', 'public/frames'];
let activeFrameBasePath = '';
const frameFileName = (index) => `ezgif-frame-${index.toString().padStart(3, '0')}.png`;
const frameUrls = (index) => framePathCandidates.map(
    (basePath) => `${basePath}/${frameFolder}/${frameFileName(index)}`
);

// Preloading images
const images = [];
const burger = {
    frame: 0,
    targetFrame: 0
};

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
                activeFrameBasePath = matched.split(`/${frameFolder}/`)[0];
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
    
    if (img && img.complete && img.naturalWidth > 0) {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Fit image into a target viewport zone with mobile-first tuning.
        const isMobile = window.innerWidth <= 768;
        const maxWidth = canvasWidth * (isMobile ? 0.98 : 0.98);
        const maxHeight = canvasHeight * (isMobile ? 0.98 : 0.96);
        const fitScale = Math.min(maxWidth / img.width, maxHeight / img.height);
        const mobileScaleBoost = isMobile ? 1.5 : 1;
        const drawWidth = img.width * fitScale * mobileScaleBoost;
        const drawHeight = img.height * fitScale * mobileScaleBoost;

        // Lift burger slightly on mobile for better visual centering.
        const yOffset = isMobile ? -canvasHeight * 0.03 : 0;
        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2 + yOffset;

        context.drawImage(img, x, y, drawWidth, drawHeight);
    } else {
        // Fallback for missing frames
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.fillStyle = '#ff9500';
        context.font = '20px Outfit';
        context.textAlign = 'center';
        context.fillText('Frames not found. Checked multiple frame paths.', canvasWidth / 2, canvasHeight / 2);
    }
}

// Initial calls
preloadImages();
resizeCanvas();
updateScroll();
renderBurger();
