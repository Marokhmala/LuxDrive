function playLoadingScreen() {
    // Only run on the home page (index.html or root)
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    if (!isHomePage) return;

    // Check if intro has been seen via localStorage
    if (localStorage.getItem('luxedrive_intro_seen') === 'true') {
        return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'loading-screen-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.8s ease-out;
    `;

    // Create video
    const video = document.createElement('video');
    video.src = './logo/LuxDrive-LoadingScreen.mp4';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
        max-width: 80%;
        max-height: 80%;
        border-radius: 12px;
        box-shadow: 0 0 50px rgba(0,0,0,0.5);
    `;

    overlay.appendChild(video);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const finish = () => {
        if (overlay.style.opacity === '0') return; // Prevent double trigger
        overlay.style.opacity = '0';
        document.body.style.overflow = '';
        localStorage.setItem('luxedrive_intro_seen', 'true');
        setTimeout(() => {
            overlay.remove();
        }, 800);
    };

    video.addEventListener('ended', finish);

    // Fallback: If video fails or gets stuck, allow closing on click
    overlay.addEventListener('click', finish);

    // Fallback: Max timeout of 10 seconds
    setTimeout(finish, 10000);
}

// Global invocation: runs for EVERYONE immediately on load after DOM is ready enough for body
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playLoadingScreen);
} else {
    playLoadingScreen();
}
