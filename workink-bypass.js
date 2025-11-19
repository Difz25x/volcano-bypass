(function () {
    'use strict';

    const host = location.hostname;
    const defaultTime = 30;
    const normalTime = 60;
    const ver = "1.0.6.7";

    let currentLanguage = localStorage.getItem('lang') || 'en';
    let currentTime = localStorage.getItem('waitTime') || defaultTime;
    let isMinimazed = localStorage.getItem('isMinimazed') || false;

    const translations = {
        vi: {
            title: "DIFZ25X BYPASS",
            pleaseSolveCaptcha: "Vui lòng hoàn thành CAPTCHA để tiếp tục",
            captchaSuccess: "CAPTCHA đã được xác minh thành công",
            redirectingToWork: "Đang chuyển hướng đến Work.ink...",
            bypassSuccessCopy: "Bypass thành công! Khóa đã được sao chép",
            bypassSuccess: "Bỏ qua thành công, đang chờ {time}s...",
            backToCheckpoint: "Đang quay lại điểm kiểm tra...",
            captchaSuccessBypassing: "CAPTCHA đã thành công, đang tiến hành bypass...",
            expiredLink: "Liên kết của bạn không hợp lệ hoặc đã hết hạn",
            bypassingSocials: "Bỏ qua mạng xã hội... tự động tải lại cho đến khi hoàn tất, {left} hơn!",
            version: `Phiên bản ${ver}`,
            madeBy: "Được tạo bởi Difz25x",
            timeSaved: "THỜI GIAN TIẾT KIỆM",
            redirectIn: "CHUYỂN HƯỚNG SAU",
            waitTime: "Thời gian chờ",
            instant: "Tức thì",
            vietnameseLabel: "Tiếng Việt",
            englishLabel: "English"
        },
        en: {
            title: "DIFZ25X BYPASS",
            pleaseSolveCaptcha: "Please complete the CAPTCHA to continue",
            captchaSuccess: "CAPTCHA solved successfully",
            redirectingToWork: "Redirecting to Work.ink...",
            bypassSuccessCopy: "Bypass successful! Key copied",
            bypassSuccess: "Bypass successful, waiting {time}s...",
            backToCheckpoint: "Returning to checkpoint...",
            captchaSuccessBypassing: "CAPTCHA solved successfully, bypassing...",
            expiredLink: "Your link is invalid or expired",
            bypassingSocials: "Bypassing socials... auto-reload active until complete, {left} more!",
            version: `Version ${ver}`,
            madeBy: "Made by Difz25x",
            timeSaved: "TIME SAVED",
            redirectIn: "REDIRECT IN",
            waitTime: "Wait Time",
            instant: "Instant",
            vietnameseLabel: "Tiếng Việt",
            englishLabel: "English"
        },
        id: {
            title: "DIFZ25X BYPASS",
            pleaseSolveCaptcha: "Harap lengkapi CAPTCHA untuk melanjutkan",
            captchaSuccess: "CAPTCHA berhasil diselesaikan",
            redirectingToWork: "Mengalihkan ke Work.ink...",
            bypassSuccessCopy: "Bypass berhasil! Kunci disalin",
            bypassSuccess: "Bypass berhasil, menunggu {time}d...",
            backToCheckpoint: "Kembali ke checkpoint...",
            captchaSuccessBypassing: "CAPTCHA berhasil diselesaikan, melewati...",
            expiredLink: "Tautan Anda tidak valid atau kedaluwarsa",
            bypassingSocials: "Melewati media sosial...muat ulang otomatis aktif hingga selesai, {left} lagi!",
            version: `Versi ${ver}`,
            madeBy: "Dibuat oleh Difz25x",
            timeSaved: "WAKTU TERSIMPAN",
            redirectIn: "ALIHKAN DALAM",
            waitTime: "Waktu Tunggu",
            instant: "Instan",
            vietnameseLabel: "Tiếng Việt",
            englishLabel: "English"
        }
    };

    function t(key, replacements = {}) {
        const map = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
        let text = map;
        Object.keys(replacements).forEach(k => {
            text = text.replace(`{${k}}`, replacements[k]);
        });
        return text;
    }

    class BypassPanel {
        constructor() {
            this.container = null;
            this.shadow = null;
            this.statusText = null;
            this.waitSlider = null;
            this.progressFill = null;
            this.currentMessageKey = 'pleaseSolveCaptcha';
            this.isMinimized = isMinimazed;
            this.body = null;
            this.minimizeBtn = null;
            this.countdownInterval = null;
            this.init();
        }

        init() {
            this.createPanel();
            this.attachEvents();
            this.setWaitValue(currentTime);
        }

        createPanel() {
            this.container = document.createElement('div');
            this.shadow = this.container.attachShadow({ mode: 'open' });

            const style = document.createElement('style');
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

                * { margin: 0; padding: 0; box-sizing: border-box; }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes statusGlow {
                    0%, 100% {
                        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
                    }
                    50% {
                        box-shadow: 0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor;
                    }
                }

                @keyframes slideDown {
                    from {
                        max-height: 0;
                        opacity: 0;
                    }
                    to {
                        max-height: 600px;
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        max-height: 600px;
                        opacity: 1;
                    }
                    to {
                        max-height: 0;
                        opacity: 0;
                    }
                }

                .panel-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 520px;
                    z-index: 2147483647;
                    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
                    animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .panel {
                    background: #1e1c1cff;
                    border-radius: 24px;
                    overflow: hidden;
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.9),
                                0 0 0 1px rgba(139, 92, 246, 0.1);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .panel:hover {
                    border-color: rgba(139, 92, 246, 0.25);
                    transform: translateY(-2px);
                }

                .header {
                    background: linear-gradient(135deg, #0d0d0d 0%, #151515 100%);
                    padding: 24px;
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                }

                .title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #8b5cf6;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .minimize-btn {
                    background: transparent;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    color: #8b5cf6;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    font-size: 18px;
                    font-weight: 700;
                }

                .minimize-btn:hover {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: #8b5cf6;
                }

                .minimize-btn.rotating {
                    transform: rotate(180deg);
                }

                .minimize-btn:active {
                    transform: scale(0.9);
                }

                .minimize-btn.rotating:active {
                    transform: scale(0.9) rotate(180deg);
                }

                .status-section {
                    padding: 24px;
                    background: #0d0d0d;
                }

                .status-box {
                    background: #151515;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 16px;
                    padding: 18px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .status-box:hover {
                    border-color: rgba(139, 92, 246, 0.35);
                    background: #181818;
                }

                .status-content {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    gap: 14px;
                    position: relative;
                    z-index: 1;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 70%;
                    animation: statusGlow 2s ease-in-out infinite;
                    flex-shrink: 0;
                    position: relative;
                }

                .status-dot::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 1px solid currentColor;
                    opacity: 0.4;
                }

                .status-dot.info { background: #3b82f6; color: #3b82f6; }
                .status-dot.success { background: #10b981; color: #10b981; }
                .status-dot.warning { background: #f59e0b; color: #f59e0b; }
                .status-dot.error { background: #ef4444; color: #ef4444; }

                .status-text {
                    color: #d1d5db;
                    font-size: 13px;
                    font-weight: 500;
                    flex: 1;
                    line-height: 1.6;
                    letter-spacing: 0.3px;
                }

                .panel-body {
                    max-height: 600px;
                    overflow: hidden;
                    opacity: 1;
                    transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                                opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .panel-body.minimizing {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .panel-body.maximizing {
                    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .panel-body.hidden {
                    max-height: 0;
                    opacity: 0;
                }

                .language-section {
                    padding: 24px;
                    background: #0d0d0d;
                    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
                }

                .lang-toggle {
                    display: flex;
                    gap: 10px;
                    background: #151515;
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid rgba(139, 92, 246, 0.1);
                }

                .lang-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #6b7280;
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    transition: all 0.2s ease;
                }

                .lang-btn:hover {
                    color: #9ca3af;
                    background: rgba(138, 92, 246, 0.27);
                }

                .lang-btn.active {
                    background: #8b5cf6;
                    color: #000;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                }

                .slider-section {
                    background: #151515;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid rgba(139, 92, 246, 0.1);
                    margin-top: 16px;
                }

                .slider-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .slider-title {
                    font-size: 11px;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .slider-value {
                    color: #8b5cf6;
                    font-size: 13px;
                    font-weight: 700;
                    background: rgba(139, 92, 246, 0.1);
                    padding: 4px 10px;
                    border-radius: 6px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    min-width: 45px;
                    text-align: center;
                }

                .slider {
                    width: 100%;
                    height: 4px;
                    border-radius: 2px;
                    background: #1f1f1f;
                    outline: none;
                    -webkit-appearance: none;
                    margin-bottom: 12px;
                    cursor: pointer;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #8b5cf6;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3);
                }

                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #8b5cf6;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: rgba(255,255,255,0.4);
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 12px;
                }

                .progress-fill {
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(90deg, #8b5cf6, #6366f1);
                    border-radius: 10px;
                    transition: width 0.1s linear;
                }

                .info-section {
                    padding: 24px;
                    background: #0d0d0d;
                    text-align: center;
                }

                .version, .credit {
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                .links {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    font-size: 11px;
                    margin-top: 12px;
                }

                .links a {
                    color: #8b5cf6;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .links a:hover {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: #8b5cf6;
                }

                @media (max-width: 480px) {
                    .panel-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        width: auto;
                    }
                }
            `;

            this.shadow.appendChild(style);

            const html = `
                <div class="panel-container">
                    <div class="panel" id="main-panel">
                        <div class="header">
                            <div class="title" id="panel-title">${t('title')}</div>
                            <button id="minimize-btn" class="minimize-btn">−</button>
                        </div>

                        <div class="status-section">
                            <div class="status-box">
                                <div class="status-content">
                                    <div class="status-dot info" id="status-dot1"></div>
                                    <div class="status-text" id="status-text">${t('pleaseSolveCaptcha')}</div>
                                    <div class="status-dot info" id="status-dot2"></div>
                                </div>
                            </div>

                            <div class="slider-section">
                                <div class="slider-header">
                                    <div class="slider-title" id="wait-title">${t('waitTime')}</div>
                                    <div class="slider-value" id="wait-value">8s</div>
                                </div>
                                <input type="range" id="wait-slider" class="slider" min="0" max="30" value="8">
                                <div class="slider-labels">
                                    <span id="instant-label">${t('instant')}</span>
                                    <span>30s</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progress-fill"></div>
                                </div>
                            </div>
                        </div>

                        <div class="panel-body" id="panel-body">
                            <div class="language-section">
                                <div class="lang-toggle">
                                    <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">English</button>
                                    <button class="lang-btn ${currentLanguage === 'vi' ? 'active' : ''}" data-lang="vi">Tiếng Việt</button>
                                    <button class="lang-btn ${currentLanguage === 'id' ? 'active' : ''}" data-lang="id">Indonsia</button>
                                </div>
                            </div>

                            <div class="info-section">
                                <div class="version" id="version-text">${t('version')}</div>
                                <div class="credit" id="credit-text">${t('madeBy')}</div>
                                <div class="links">
                                    <a href="https://www.youtube.com/@dyydeptry" target="_blank">YouTube</a>
                                    <a href="https://discord.gg/DWyEfeBCzY" target="_blank">Discord</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            this.shadow.appendChild(wrapper.firstElementChild);

            this.statusText = this.shadow.getElementById('status-text');
            this.statusDot1 = this.shadow.querySelector('#status-dot1');
            this.statusDot2 = this.shadow.querySelector('#status-dot2');
            this.waitSlider = this.shadow.getElementById('wait-slider');
            this.waitValueEl = this.shadow.getElementById('wait-value');
            this.progressFill = this.shadow.getElementById('progress-fill');
            this.mainPanel = this.shadow.getElementById('main-panel');
            this.body = this.shadow.querySelector('#panel-body');
            this.minimizeBtn = this.shadow.querySelector('#minimize-btn');
            this.langBtns = Array.from(this.shadow.querySelectorAll('.lang-btn'));

            document.documentElement.appendChild(this.container);
        }

        attachEvents() {
            this.waitSlider.value = currentTime;
            this.setWaitValue(currentTime);

            if (isMinimazed) {
                this.body.classList.add('hidden');
                this.minimizeBtn.textContent = '+';
                this.minimizeBtn.classList.add('rotating');
            }

            this.waitSlider.addEventListener('input', (e) => {
                const sec = parseInt(e.target.value);
                this.setWaitValue(sec);
                localStorage.setItem('waitTime', sec);
                currentTime = sec;
            });

            this.langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    currentLanguage = btn.dataset.lang;
                    localStorage.setItem('lang', currentLanguage);
                    this.updateLanguage();
                });
            });

            this.minimizeBtn.addEventListener('click', () => {
                this.isMinimized = !this.isMinimized;
                localStorage.setItem('isMinimazed', this.isMinimized)
                this.body.classList.toggle('hidden');
                this.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
            });
        }

        updateLanguage() {
            this.langBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
            });
            this.shadow.getElementById('panel-title').textContent = t('title');
            this.shadow.getElementById('status-text').textContent = t(this.currentMessageKey);
            this.shadow.getElementById('wait-title').textContent = t('waitTime');
            this.shadow.getElementById('instant-label').textContent = t('instant');
            this.shadow.getElementById('version-text').textContent = t('version');
            this.shadow.getElementById('credit-text').textContent = t('madeBy');
        }

        setWaitValue(seconds) {
            this.waitValueEl.textContent = `${seconds}s`;
            this.waitSlider.value = seconds;
        }

        startCountdown(seconds) {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }

            let remaining = seconds;
            this.progressFill.style.width = '0%';

            const updateProgress = () => {
                const progress = ((seconds - remaining) / seconds) * 100;
                this.progressFill.style.width = `${progress}%`;

                const message = `${t('captchaSuccessBypassing')} ${remaining}s`;
                this.statusText.textContent = message;
            };

            updateProgress();

            this.countdownInterval = setInterval(() => {
                remaining--;
                if (remaining >= 0) {
                    updateProgress();
                } else {
                    clearInterval(this.countdownInterval);
                    this.progressFill.style.width = '100%';
                }
            }, 1000);
        }

        show(messageKey, type = 'info', replacements = {}) {
            this.currentMessageKey = messageKey;
            this.statusText.textContent = t(messageKey, replacements);
            this.statusDot1.className = `status-dot ${type}`;
            this.statusDot2.className = `status-dot ${type}`;
        }
    }

    let panel = null;
    setTimeout(() => {
        panel = new BypassPanel();
        panel.show('pleaseSolveCaptcha', 'info');
    }, 100);

    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    // Handler for VOLCANO
    function handleVolcano() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');

        let alreadyDoneContinue = false;
        let alreadyDoneCopy = false;

        function actOnCheckpoint(node) {
            if (!alreadyDoneContinue) {
                const buttons = node && node.nodeType === 1
                    ? node.matches('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                        ? [node]
                        : node.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                    : document.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]');
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.value || "").trim().toLowerCase();
                    if (text.includes("continue") || text.includes("next step")) {
                        const disabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
                        const style = getComputedStyle(btn);
                        const visible = style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
                        if (visible && !disabled) {
                            alreadyDoneContinue = true;
                            if (panel) panel.show('captchaSuccess', 'success');

                            for (const btn of buttons) {
                                const currentBtn = btn;
                                const currentPanel = panel;

                                setTimeout(() => {
                                    try {
                                        currentBtn.click();
                                        if (currentPanel) currentPanel.show('redirectingToWork', 'info');
                                    } catch (err) {
                                        setTimeout(actOnCheckpoint, 1000)
                                    }
                                }, 300);
                            }
                            return true;
                        }
                    }
                }
            }

            const copyBtn = node && node.nodeType === 1
                ? node.matches("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                    ? node
                    : node.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                : document.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']");
            if (copyBtn) {
                setInterval(() => {
                    try {
                        copyBtn.click();
                        if (panel) panel.show('bypassSuccessCopy', 'success');
                    } catch (err) {
                        copyBtn.click();
                    }
                }, 500);
                return true;
            }

            return false;
        }

        const mo = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (actOnCheckpoint(node)) {
                                if (alreadyDoneCopy) {
                                    mo.disconnect();
                                    return;
                                }
                            }
                        }
                    }
                }
                if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
                    if (actOnCheckpoint(mutation.target)) {
                        if (alreadyDoneCopy) {
                            mo.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'style'] });

        if (actOnCheckpoint()) {
            if (alreadyDoneCopy) {
                mo.disconnect();
            }
        }
    }


    // Handler for WORK.INK
    function handleWorkInk() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');

        let sessionController = undefined;
        let sendMessage = undefined;
        let LinkInfo = undefined;
        let LinkDestination = undefined;
        let bypassTriggered = false;
        let destinationReceived = false;
        let destinationProcessed = false;
        let socialCheckInProgress = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"]
        };

        function getName(obj, candidates = null) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            if (candidates) {
                for (let i = 0; i < candidates.length; i++) {
                    const name = candidates[i];
                    if (typeof obj[name] === "function") {
                        return { fn: obj[name], index: i, name };
                    }
                }
            } else {
                for (let i in obj) {
                    if (typeof obj[i] == "function" && obj[i].length == 2) {
                        return { fn: obj[i], name: i };
                    }
                }
            }
            return { fn: null, index: -1, name: null };
        }

        const types = {
            an: 'c_announce',
            mo: 'c_monetization',
            ss: 'c_social_started',
            rr: 'c_recaptcha_response',
            hr: 'c_hcaptcha_response',
            tr: 'c_turnstile_response',
            ad: 'c_adblocker_detected',
            fl: 'c_focus_lost',
            os: 'c_offers_skipped',
            ok: 'c_offer_skipped',
            fo: 'c_focus',
            wp: 'c_workink_pass_available',
            wu: 'c_workink_pass_use',
            pi: 'c_ping',
            kk: 'c_keyapp_key'
        };

        console.log('[Debug] WebSocket status:', {
            exists: !!sessionController?.websocket,
            readyState: sessionController?.websocket?.readyState,
            url: sessionController?.websocket?.url
        });

        function triggerBypass(reason) {
            if (bypassTriggered) {
                return;
            }
            bypassTriggered = true;
            console.log('[Debug] trigger Bypass via:', reason);
            if (panel) panel.show('captchaSuccessBypassing', 'success');
            let retryCount = 0;

            function keepSpoofing() {
                if (destinationReceived) {
                    return;
                }
                retryCount++;
                spoofWorkink();
                setTimeout(keepSpoofing, 3000);
            }
            keepSpoofing();
        }

        function spoofWorkink() {
            if (!LinkInfo) {
                return;
            }

            console.log('[Debug] spoof Workink starting, linkInfo:', LinkInfo);

            const socials = LinkInfo.socials || [];
            console.log('[Debug] Total socials to fake:', socials.length);

            if (socials.length > 0) {
                if (panel) panel.show('bypassingSocials', 'warning', { left: socials.length });

                (async () => {
                    for (let i = 0; i < socials.length; i++) {
                        const soc = socials[i];
                        try {
                            if (sendMessage && sessionController) {
                                const payload = { url: soc.url };

                                if (sessionController.websocket && sessionController.websocket.readyState === WebSocket.OPEN) {
                                    console.log(`[Debug] WebSocket open, sending social [${i + 1}/${socials.length}]`);

                                    sendMessage.call(sessionController, types.ss, payload);

                                    console.log(`[Debug] Social [${i + 1}/${socials.length}] sent successfully`);
                                } else {
                                    console.error(`[Debug] WebSocket not ready! State:`, sessionController.websocket?.readyState);
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    i--;
                                    continue;
                                }
                            } else {
                                console.warn(`[Debug] sendMessage or sessionController is null`, { sendMessage, sessionController });
                            }
                        } catch (e) {
                            console.error(`[Debug] Error sending social [${i + 1}/${socials.length}]:`, e);
                        }
                    }

                    console.log('[Debug] All socials sent, reloading page...');
                    setTimeout(() => {
                        console.log('[Debug] Reloading page after social spoof...');
                        window.location.reload();
                    }, 1000);
                })();
            } else {
                console.log('[Debug] No socials to send, processing monetizations directly...');
                handleMonetizations();
            }

            async function handleMonetizations() {
                const monetizations = sessionController?.monetizations || [];
                console.log('[Debug] Total monetizations to fake:', monetizations.length);

                for (let i = 0; i < monetizations.length; i++) {
                    const monetization = monetizations[i];
                    console.log(`[Debug] Processing monetization [${i+1}/${monetizations.length}]:`, monetization);
                    const monetizationId = monetization.id;
                    const monetizationSendMessage = monetization.sendMessage;

                    if (!monetizationSendMessage) {
                        console.log(`[Debug] Skipping monetization [${i+1}/${monetizations.length}]: no sendMessage function`);
                        continue;
                    }

                    try {
                        switch (monetizationId) {
                            case 22: {
                                monetizationSendMessage.call(monetization, { event: 'read' });
                                console.log(`[Debug] Faked readArticles2 [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            case 25: {
                                monetizationSendMessage.call(monetization, { event: 'start' });
                                monetizationSendMessage.call(monetization, { event: 'installedClicked' });
                                fetch('/_api/v2/affiliate/operaGX', { method: 'GET', mode: 'no-cors' });
                                setTimeout(() => {
                                    fetch('https://work.ink/_api/v2/callback/operaGX', {
                                        method: 'POST',
                                        mode: 'no-cors',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            'noteligible': true
                                        })
                                    });
                                }, 5000);
                                console.log(`[Debug] Faked operaGX [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            case 34: {
                                monetizationSendMessage.call(monetization, { event: 'start' });
                                monetizationSendMessage.call(monetization, { event: 'installedClicked' });
                                console.log(`[Debug] Faked norton [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            case 71: {
                                monetizationSendMessage.call(monetization, { event: 'start' });
                                monetizationSendMessage.call(monetization, { event: 'installed' });
                                console.log(`[Debug] Faked externalArticles [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            case 45: {
                                monetizationSendMessage.call(monetization, { event: 'installed' });
                                console.log(`[Debug] Faked pdfeditor [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            case 57: {
                                monetizationSendMessage.call(monetization, { event: 'installed' });
                                console.log(`[Debug] Faked betterdeals [${i+1}/${monetizations.length}]`);
                                break;
                            }
                            default: {
                                console.log(`[Debug] Unknown monetization [${i+1}/${monetizations.length}]:`, monetization);
                                break;
                            }
                        }
                    } catch (e) {
                        console.error(`[Debug] Error faking monetization [${i+1}/${monetizations.length}]:`, monetization, e);
                    }
                }

                console.log('[Debug] spoof Workink completed');
            }
        }

        function createSendMessage() {
            return function (...args) {
                const packet_type = args[0];
                const packet_data = args[1];
                if (packet_type !== types.pi) {
                    console.log('[Debug] Message sent:', packet_type, packet_data);
                }
                if (packet_type === types.tr) {
                    triggerBypass('tr');
                }
                return sendMessage.apply(this, args);
            };
        }

        function createLinkInfo() {
            return async function (...args) {
                const [info] = args;
                LinkInfo = info
                console.log('[Debug] Link info:', info);
                spoofWorkink();
                try {
                    Object.defineProperty(info, 'isAdblockEnabled', {
                        get: () => false,
                        set: () => { },
                        configurable: false,
                        enumerable: true
                    });
                } catch (e) {

                }
                return LinkInfo ? LinkInfo.apply(this, args): undefined;
            };
        }

        function redirect(url) {
            if (panel) panel.show('backToCheckpoint', 'info')
            window.location.href = url;
        }

        function startCountdown(url, waitLeft) {
            const interval = setInterval(() => {
                waitLeft -= 1;
                if (waitLeft > 0) {
                    console.log('[Debug] startCountdown: Time remaining:', waitLeft);
                    if (panel) panel.show('bypassSuccess', 'warning', { time: Math.ceil(waitLeft) });
                } else {
                    clearInterval(interval);
                    redirect(url);
                }
            }, 1000);
        }

        function createLinkDestination() {
            return async function (...args) {
                const [data] = args;
                destinationReceived = true;
                console.log("[Debug] Destination data: ", data)

                if (!destinationProcessed) {
                    destinationProcessed = true;
                    const waitTimeSeconds = parseInt(panel.waitSlider.value);
                    if (waitTimeSeconds <= 0) {
                        redirect(data.url)
                    } else {
                        startCountdown(data.url, waitTimeSeconds);
                    }
                }
                return LinkDestination ? LinkDestination.apply(this, args): undefined;
            };
        }

        function setupProxies() {
            const send = getName(sessionController);
            const info = getName(sessionController, map.onLI);
            const dest = getName(sessionController, map.onLD);

            if (!send.fn || !info.fn || !dest.fn) return;

            sendMessage = send.fn;
            LinkInfo = info.fn;
            LinkDestination = dest.fn;

            try {
                Object.defineProperty(sessionController, send.name, {
                    get: createSendMessage,
                    set: v => (sendMessage = v),
                    configurable: true
                });
                Object.defineProperty(sessionController, info.name, {
                    get: createLinkInfo,
                    set: v => (LinkInfo = v),
                    configurable: true
                });
                Object.defineProperty(sessionController, dest.name, {
                    get: createLinkDestination,
                    set: v => (LinkDestination = v),
                    configurable: true
                });
            } catch (e) {

            }
        }

        function checkController(target, prop, value) {
            if (value &&
                typeof value === 'object' &&
                getName(value).fn &&
                getName(value, map.onLI).fn &&
                getName(value, map.onLD).fn &&
                !sessionController
            ) {
                sessionController = value;
                setupProxies();
                console.log('[Debug] Controller detected:', sessionController);
            }
            return Reflect.set(target, prop, value);
        }

        function createComponentProxy(comp) {
            return new Proxy(comp, {
                construct(target, args) {
                    const instance = Reflect.construct(target, args);
                    if (instance.$$.ctx) {
                        instance.$$.ctx = new Proxy(instance.$$.ctx, { set: checkController });
                    }
                    return instance;
                }
            });
        }

        function createNodeProxy(node) {
            return async (...args) => {
                const result = await node(...args);
                return new Proxy(result, {
                    get: (t, p) => p === 'component' ? createComponentProxy(t.component) : Reflect.get(t, p)
                });
            };
        }

        function createKitProxy(kit) {
            if (!kit?.start) return [false, kit];
            return [
                true,
                new Proxy(kit, {
                    get(target, prop) {
                        if (prop === 'start') {
                            return function (...args) {
                                const [nodes, , opts] = args;
                                if (nodes?.nodes && opts?.node_ids) {
                                    const idx = opts.node_ids[1];
                                    if (nodes.nodes[idx]) {
                                        nodes.nodes[idx] = createNodeProxy(nodes.nodes[idx]);
                                    }
                                }
                                return kit.start.apply(this, args);
                            };
                        }
                        return Reflect.get(target, prop);
                    }
                })
            ];
        }

        function setupInterception() {
            const origPromiseAll = Promise.all;
            let intercepted = false;

            Promise.all = async function (promises) {
                const result = origPromiseAll.call(this, promises);
                if (!intercepted) {
                    intercepted = true;
                    return await new Promise((resolve) => {
                        result.then(([kit, app, ...args]) => {
                            const [success, created] = createKitProxy(kit);
                            if (success) {
                                Promise.all = origPromiseAll;
                            }
                            resolve([created, app, ...args]);
                        });
                    });
                }
                return await result;
            };
        }

        window.googletag = { cmd: [], _loaded_: true };

        const blockedClasses = [
            "adsbygoogle",
            "adsense-wrapper",
            "inline-ad",
            "gpt-billboard-container",
            "[&:not(:first-child)]:mt-12",
            "lg:block"
        ];

        const blockedIds = [
            "billboard-1",
            "billboard-2",
            "billboard-3",
            "sidebar-ad-1",
            "skyscraper-ad-1"
        ];

        setupInterception();

        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        blockedClasses.forEach((cls) => {
                            if (node.classList?.contains(cls)) {
                                node.remove();
                                console.log('[Debug]: Removed ad by class:', cls, node);
                            }
                            node.querySelectorAll?.(`.${CSS.escape(cls)}`).forEach((el) => {
                                el.remove();
                                console.log('[Debug]: Removed nested ad by class:', cls, el);
                            });
                        });

                        blockedIds.forEach((id) => {
                            if (node.id === id) {
                                node.remove();
                                console.log('[Debug]: Removed ad by id:', id, node);
                            }
                            node.querySelectorAll?.(`#${id}`).forEach((el) => {
                                el.remove();
                                console.log('[Debug]: Removed nested ad by id:', id, el);
                            });
                        });

                        let btnId = "1ao8oou"

                        if (node.matches(`.button.large.accessBtn.pos-relative.svelte-${btnId}`) && node.textContent.includes('Go To Destination')) {
                            triggerBypass('gtd');
                        }
                    }
                }
            }
        });
        ob.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    }
})();
