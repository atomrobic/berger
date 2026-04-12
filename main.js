const canvas = document.getElementById('burger-canvas');
const context = canvas.getContext('2d');

const frameCount = 240;
const frameFolder = 'ezgif-751c9eb1051126ed-png-split';
const framePathCandidates = ['/frames', '/public/frames'];
let activeFrameBasePath = framePathCandidates[0];
const currentFrame = (index) => (
    `${activeFrameBasePath}/${frameFolder}/ezgif-frame-${index.toString().padStart(3, '0')}.png`
);

// Preloading images
const images = [];
const burger = {
    frame: 0,
    targetFrame: 0
};

async function detectFrameBasePath() {
    for (const candidate of framePathCandidates) {
        const probeUrl = `${candidate}/${frameFolder}/ezgif-frame-001.png`;
        try {
            const response = await fetch(probeUrl, { method: 'HEAD' });
            if (response.ok) {
                return candidate;
            }
        } catch (_error) {
            // Ignore and continue to next candidate path.
        }
    }

    return framePathCandidates[0];
}

function preloadImages() {
    let loadedImages = 0;
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            loadedImages++;
            if (loadedImages === frameCount) {
                console.log(`All frames loaded from ${activeFrameBasePath}`);
            }
        };
        images.push(img);
    }
}

// Set canvas dimensions
function resizeCanvas() {
    // High DPI support
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    context.scale(scale, scale);
    renderBurger();
}

window.addEventListener('resize', resizeCanvas);

// Scroll Handling
const animationSection = document.querySelector('.animation-container');
const scrollSpacer = document.querySelector('.scroll-spacer');

function updateScroll() {
    const sectionTop = animationSection.offsetTop;
    const sectionHeight = scrollSpacer.offsetHeight;
    const scrollPos = window.pageYOffset - sectionTop;
    
    // Percentage through the scroll spacer
    let scrollFraction = scrollPos / sectionHeight;
    
    // Clamp between 0 and 1
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));
    
    // Set target frame
    burger.targetFrame = Math.floor(scrollFraction * (frameCount - 1));
}

window.addEventListener('scroll', updateScroll);

// Smoothing Loop (Inertia)
function animate() {
    // Smoother transition: LERP (Linear Interpolation)
    const easing = 0.1; // Adjust for more/less inertia
    burger.frame += (burger.targetFrame - burger.frame) * easing;
    
    renderBurger();
    requestAnimationFrame(animate);
}

function renderBurger() {
    const frameIndex = Math.round(burger.frame);
    const img = images[frameIndex];
    
    if (img && img.complete) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw image centered and contained
        const imgRatio = img.width / img.height;
        const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight;
        
        if (imgRatio > canvasRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
        } else {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
        }
        
        // Standard Zoom for Mobile (Balanced)
        const isMobile = window.innerWidth <= 768;
        const zoom = isMobile ? 1.8 : 1.0; // Zoom in 80% on mobile
        
        const drawWidthZoomed = drawWidth * zoom;
        const drawHeightZoomed = drawHeight * zoom;
        
        const x = (canvasWidth - drawWidthZoomed) / 2;
        const y = (canvasHeight - drawHeightZoomed) / 2;
        
        context.drawImage(img, x, y, drawWidthZoomed, drawHeightZoomed);
    } else {
        // Fallback for missing frames
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ff9500';
        context.font = '20px Outfit';
        context.textAlign = 'center';
        context.fillText('Frames not found. Checked /frames and /public/frames.', canvas.width/(2 * (window.devicePixelRatio || 1)), canvas.height/(2 * (window.devicePixelRatio || 1)));
    }
}

// Initial calls
detectFrameBasePath().then((basePath) => {
    activeFrameBasePath = basePath;
    preloadImages();
    resizeCanvas();
    animate();
    updateScroll();
    renderBurger();
});
