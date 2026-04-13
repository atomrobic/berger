(() => {
    const FIRST_FRAME = 41;
    const LAST_FRAME = 240;
    const TOTAL = LAST_FRAME - FIRST_FRAME + 1;
    const FRAME = (n) =>
        `/dist/frames/ezgif-31981f8e3c1ad0ef-jpg/ezgif-frame-${String(n).padStart(3, '0')}.jpg`;

    const canvas = document.getElementById('burger-canvas');
    const frameSection = document.querySelector('.animation-frame');
    const bentoSection = document.querySelector('.bento-section');
    if (!canvas || !frameSection || !bentoSection) return;

    const ctx = canvas.getContext('2d');
    const imgs = new Array(TOTAL);
    let current = 0;
    let rafPending = false;
    let loaded = false;

    function getNearestLoadedIndex(index) {
        if (imgs[index] && imgs[index].complete && imgs[index].naturalWidth) return index;
        for (let offset = 1; offset < TOTAL; offset++) {
            const left = index - offset;
            if (left >= 0 && imgs[left] && imgs[left].complete && imgs[left].naturalWidth) {
                return left;
            }
            const right = index + offset;
            if (right < TOTAL && imgs[right] && imgs[right].complete && imgs[right].naturalWidth) {
                return right;
            }
        }
        return -1;
    }

    function draw(index) {
        const renderIndex = getNearestLoadedIndex(index);
        if (renderIndex < 0) return;
        const img = imgs[renderIndex];
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        draw(current);
    }

    function preload() {
        if (loaded) return;
        loaded = true;

        for (let frame = FIRST_FRAME; frame <= LAST_FRAME; frame++) {
            const idx = frame - FIRST_FRAME;
            const img = new Image();
            img.src = FRAME(frame);
            img.onload = () => {
                if (frame === FIRST_FRAME) {
                    resize();
                }
            };
            imgs[idx] = img;
        }
    }

    const io = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                preload();
                io.disconnect();
            }
        },
        { rootMargin: '400px 0px', threshold: 0 }
    );
    io.observe(frameSection);

    function update() {
        rafPending = false;
        if (!loaded) return;

        const isMobile = window.innerWidth <= 768;
        let t = 0;

        if (isMobile) {
            const rect = frameSection.getBoundingClientRect();
            const startAt = window.innerHeight * 0.9;
            const totalDistance = window.innerHeight + rect.height;
            const traveled = startAt - rect.top;
            t = Math.max(0, Math.min(1, traveled / totalDistance));
        } else {
            const rect = bentoSection.getBoundingClientRect();
            const sectionH = bentoSection.offsetHeight || 1;
            const scrolled = -(rect.top - window.innerHeight * 0.2);
            const progressRange = sectionH * 0.8;
            t = Math.max(0, Math.min(1, scrolled / progressRange));
        }
        const idx = Math.round(t * (TOTAL - 1));

        if (idx !== current) {
            current = idx;
            draw(current);
        }
    }

    window.addEventListener(
        'scroll',
        () => {
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(update);
            }
        },
        { passive: true }
    );

    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
})();
