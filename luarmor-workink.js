(function () {
    'use strict';

    const host = location.hostname;
    const defaultTime = 21;
    const debug = true;
    if (host.includes("ads.luarmor.net")) handleLuarmor();
    else if (host.includes("work.ink")) handleWorkInk();

    function handleWorkInk() {
        const startTime = Date.now();
        let sessionControllerA = undefined;
        let sendMessageA = undefined;
        let onLinkInfoA = undefined;
        let onLinkDestinationA = undefined;
        let bypassTriggered = false;
        let destinationReceived = false;
        let turnstileReceived = false;
        let controllerDetected = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"],
        };

        const originalFetch = unsafeWindow.fetch;

        // Timpa fungsi fetch di window halaman web
        unsafeWindow.fetch = function(url, options) {
            const requestUrl = typeof url === 'string' ? url : url.url;

        if (
            requestUrl.includes("work.ink/cdn-cgi/challenge-platform/scripts/jsd/main.js")
        ) {
            console.log("[Main] Blocked challenge script:", requestUrl);

            return Promise.reject(new Error('Request blocked by Tampermonkey script'));
        }

            return originalFetch.call(unsafeWindow, url, options);
        };

        function resolveName(obj, candidates) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i = 0; i < candidates.length; i++) {
                const name = candidates[i];
                if (typeof obj[name] === "function") {
                    return { fn: obj[name], index: i, name };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        function resolveWriteFunction(obj) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i in obj) {
                if (typeof obj[i] === "function" && obj[i].length === 2) {
                    return { fn: obj[i], name: i };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        const types = {
            an: "c_announce",
            mo: "c_monetization",
            ss: "c_social_started",
            rr: "c_recaptcha_response",
            hr: "c_hcaptcha_response",
            tr: "c_turnstile_response",
            ad: "c_adblocker_detected",
            fl: "c_focus_lost",
            os: "c_offers_skipped",
            ok: "c_offer_skipped",
            fo: "c_focus",
            wp: "c_workink_pass_available",
            wu: "c_workink_pass_use",
            pi: "c_ping",
            kk: "c_keyapp_key",
        };

        function triggerBypass(reason) {
            if (bypassTriggered) {
                if (debug)
                    console.log(
                        "[Debug] trigger Bypass skipped, already triggered",
                    );
                return;
            }
            bypassTriggered = true;
            if (debug) console.log("[Debug] trigger Bypass via:", reason);

            let retryCount = 0;
            const maxRetries = 5;

            function keepSpoofing() {
                if (destinationReceived) {
                    if (debug)
                        console.log(
                            "[Debug] Destination received, stopping spoofing after",
                            retryCount,
                            "attempts",
                        );
                    return;
                }

                retryCount++;
                if (debug)
                    console.log(`[Debug] Spoofing attempt #${retryCount}`);

                if (retryCount > maxRetries) {
                    if (debug)
                        console.log(
                            "[Debug] Max retries reached, reloading page...",
                        );
                    window.location.reload();
                    return;
                }

                spoofWorkink();
                setTimeout(keepSpoofing, 3000);
            }

            keepSpoofing();
            if (debug)
                console.log(
                    "[Debug] Waiting for server to send destination data...",
                );
        }

        function spoofWorkink() {
            if (!onLinkInfoA) {
                if (debug)
                    console.log("[Debug] spoof Workink skipped: no linkInfo");
                return;
            }
            if (debug)
                console.log(
                    "[Debug] spoof Workink starting, linkInfo:",
                    onLinkInfoA,
                );

            const socials = onLinkInfoA.socials || [];
            if (debug)
                console.log("[Debug] Total socials to fake:", socials.length);

            if (socials.length > 0) {
                (async () => {
                    for (let i = 0; i < socials.length; i++) {
                        const soc = socials[i];
                        try {
                            if (sendMessageA && sessionControllerA) {
                                const payload = { url: soc.url };

                                if (
                                    sessionControllerA.websocket &&
                                    sessionControllerA.websocket.readyState ===
                                        WebSocket.OPEN
                                ) {
                                    if (debug)
                                        console.log(
                                            `[Debug] WebSocket open, sending social [${i + 1}/${socials.length}]`,
                                        );

                                    sendMessageA.call(
                                        sessionControllerA,
                                        types.ss,
                                        payload,
                                    );

                                    if (debug)
                                        console.log(
                                            `[Debug] Social [${i + 1}/${socials.length}] sent successfully`,
                                        );
                                } else {
                                    if (debug)
                                        console.error(
                                            `[Debug] WebSocket not ready! State:`,
                                            sessionControllerA.websocket
                                                ?.readyState,
                                        );
                                    await new Promise((resolve) =>
                                        setTimeout(resolve, 1000),
                                    );
                                    i--;
                                    continue;
                                }
                            } else {
                                if (debug)
                                    console.warn(
                                        `[Debug] sendMessage or sessionController is null`,
                                        { sendMessageA, sessionControllerA },
                                    );
                            }
                        } catch (e) {
                            if (debug)
                                console.error(
                                    `[Debug] Error sending social [${i + 1}/${socials.length}]:`,
                                    e,
                                );
                        }
                    }

                    if (debug)
                        console.log(
                            "[Debug] All socials sent, reloading page...",
                        );
                    setTimeout(() => {
                        if (debug)
                            console.log(
                                "[Debug] Reloading page after social spoof...",
                            );
                        window.location.reload();
                    }, 1000);
                })();
            } else {
                if (debug)
                    console.log(
                        "[Debug] No socials to send, processing monetizations directly...",
                    );
                handleMonetizations();
            }

            async function handleMonetizations() {
                const monetizations = sessionControllerA?.monetizations || [];
                if (debug)
                    console.log(
                        "[Debug] Total monetizations to fake:",
                        monetizations.length,
                    );

                for (let i = 0; i < monetizations.length; i++) {
                    const monetization = monetizations[i];
                    if (debug)
                        console.log(
                            `[Debug] Processing monetization [${i + 1}/${monetizations.length}]:`,
                            monetization,
                        );
                    const monetizationId = monetization.id;
                    const monetizationSendMessage = monetization.sendMessage;

                    if (!monetizationSendMessage) {
                        if (debug)
                            console.log(
                                `[Debug] Skipping monetization [${i + 1}/${monetizations.length}]: no sendMessage function`,
                            );
                        continue;
                    }

                    try {
                        switch (monetizationId) {
                            case 22: {
                                monetizationSendMessage.call(monetization, {
                                    event: "read",
                                });
                                if (debug)
                                    console.log(
                                        `[Debug] Faked readArticles2 [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            case 25: {
                                monetizationSendMessage.call(monetization, {
                                    event: "start",
                                });
                                monetizationSendMessage.call(monetization, {
                                    event: "installedClicked",
                                });
                                fetch("/_api/v2/affiliate/operaGX", {
                                    method: "GET",
                                    mode: "no-cors",
                                });
                                setTimeout(() => {
                                    fetch(
                                        "https://work.ink/_api/v2/callback/operaGX",
                                        {
                                            method: "POST",
                                            mode: "no-cors",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                noteligible: true,
                                            }),
                                        },
                                    );
                                }, 5000);
                                if (debug)
                                    console.log(
                                        `[Debug] Faked operaGX [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            case 34: {
                                monetizationSendMessage.call(monetization, {
                                    event: "start",
                                });
                                monetizationSendMessage.call(monetization, {
                                    event: "installedClicked",
                                });
                                if (debug)
                                    console.log(
                                        `[Debug] Faked norton [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            case 71: {
                                monetizationSendMessage.call(monetization, {
                                    event: "start",
                                });
                                monetizationSendMessage.call(monetization, {
                                    event: "installed",
                                });
                                if (debug)
                                    console.log(
                                        `[Debug] Faked externalArticles [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            case 45: {
                                monetizationSendMessage.call(monetization, {
                                    event: "installed",
                                });
                                if (debug)
                                    console.log(
                                        `[Debug] Faked pdfeditor [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            case 57: {
                                monetizationSendMessage.call(monetization, {
                                    event: "installed",
                                });
                                if (debug)
                                    console.log(
                                        `[Debug] Faked betterdeals [${i + 1}/${monetizations.length}]`,
                                    );
                                break;
                            }
                            default: {
                                if (debug)
                                    console.log(
                                        `[Debug] Unknown monetization [${i + 1}/${monetizations.length}]:`,
                                        monetization,
                                    );
                                break;
                            }
                        }
                    } catch (e) {
                        if (debug)
                            console.error(
                                `[Debug] Error faking monetization [${i + 1}/${monetizations.length}]:`,
                                monetization,
                                e,
                            );
                    }
                }

                if (debug) console.log("[Debug] spoof Workink completed");
            }
        }

        function createSendMessageProxy() {
            return function (...args) {
                const pt = args[0];
                const pd = args[1];

                if (pt !== types.pi) {
                    if (debug) console.log("[Debug] Message sent:", pt, pd);
                }

                if (pt === types.ad) {
                    if (debug)
                        console.log("[Debug] Blocking adblocker message");
                    return;
                }

                if (pt === types.tr || pt === types.rr || pt === types.hr) {
                    turnstileReceived = true;
                    if (debug) console.log("[Debug] Captcha bypassed via TR");
                    triggerBypass("tr");
                }

                return sendMessageA
                    ? sendMessageA.apply(this, args)
                    : undefined;
            };
        }

        function createLinkInfoProxy() {
            return function (...args) {
                const info = args[0];
                onLinkInfoA = info;
                if (debug) console.log("[Debug] Link info:", info);
                spoofWorkink();
                try {
                    Object.defineProperty(info, "isAdblockEnabled", {
                        get: () => false,
                        set: () => {},
                        configurable: false,
                        enumerable: true,
                    });
                    if (debug)
                        console.log("[Debug] Adblock disabled in linkInfo");
                } catch (e) {
                    if (debug)
                        console.warn("[Debug] Define Property failed:", e);
                }
                return onLinkInfoA ? onLinkInfoA.apply(this, args) : undefined;
            };
        }

        function createDestinationProxy() {
            return function (...args) {
                const data = args[0];
                const secondsPassed = (Date.now() - startTime) / 1000;
                destinationReceived = true;
                if (debug) console.log("[Debug] Destination data:", data.url);

                let waitTimeSeconds = 5;
                const url = location.href;
                if (
                    url.includes("42rk6hcq") ||
                    url.includes("ito4wckq") ||
                    url.includes("pzarvhq1")
                ) {
                    waitTimeSeconds = 5;
                }

                const timeRemaining = waitTimeSeconds - secondsPassed;

                function doRedirect() {
                    if (debug)
                        console.log("[Debug] Redirecting to destination");

                    try {
                        if (sessionControllerA?.websocket) {
                            sessionControllerA.websocket.close();
                        }
                    } catch (e) {}

                    try {
                        window.stop();
                    } catch (e) {}

                    window.location.replace(data.url);
                }

                if (timeRemaining <= 0) {
                    doRedirect();
                } else {
                    if (debug)
                        console.log(
                            "[Debug] Waiting",
                            Math.ceil(timeRemaining),
                            "seconds",
                        );
                    setTimeout(doRedirect, timeRemaining * 1000);
                }

                return onLinkDestinationA
                    ? onLinkDestinationA.apply(this, args)
                    : undefined;
            };
        }

        function setupProxies() {
            const send = resolveWriteFunction(sessionControllerA);
            const info = resolveName(sessionControllerA, map.onLI);
            const dest = resolveName(sessionControllerA, map.onLD);

            sendMessageA = send.fn;
            onLinkInfoA = info.fn;
            onLinkDestinationA = dest.fn;

            const sendMessageProxy = createSendMessageProxy();
            const onLinkInfoProxy = createLinkInfoProxy();
            const onDestinationProxy = createDestinationProxy();

            Object.defineProperty(sessionControllerA, send.name, {
                get() {
                    return sendMessageProxy;
                },
                set(v) {
                    sendMessageA = v;
                },
                configurable: false,
                enumerable: true,
            });

            Object.defineProperty(sessionControllerA, info.name, {
                get() {
                    return onLinkInfoProxy;
                },
                set(v) {
                    onLinkInfoA = v;
                },
                configurable: false,
                enumerable: true,
            });

            Object.defineProperty(sessionControllerA, dest.name, {
                get() {
                    return onDestinationProxy;
                },
                set(v) {
                    onLinkDestinationA = v;
                },
                configurable: false,
                enumerable: true,
            });

            if (debug)
                console.log(
                    `[Debug] setupProxies: installed ${send.name}, ${info.name}, ${dest.name}`,
                );
        }

        function checkController(target, prop, value, receiver) {
            if (debug)
                console.log("[Debug] Checking prop:", prop, typeof value);
            if (
                value &&
                typeof value === "object" &&
                resolveWriteFunction(value).fn &&
                resolveName(value, map.onLI).fn &&
                resolveName(value, map.onLD).fn &&
                !sessionControllerA
            ) {
                sessionControllerA = value;
                controllerDetected = true;
                if (debug)
                    console.log(
                        "[Debug] Controller detected:",
                        sessionControllerA,
                    );
                setupProxies();
            } else {
                if (debug)
                    console.log(
                        "[Debug] checkController: No controller found for prop:",
                        prop,
                    );
            }
            return Reflect.set(target, prop, value, receiver);
        }

        function createComponentProxy(comp) {
            return new Proxy(comp, {
                construct(target, args) {
                    const instance = Reflect.construct(target, args);
                    if (instance.$$.ctx) {
                        instance.$$.ctx = new Proxy(instance.$$.ctx, {
                            set: checkController,
                        });
                    }
                    return instance;
                },
            });
        }

        function createNodeResultProxy(result) {
            return new Proxy(result, {
                get: (target, prop, receiver) => {
                    if (prop === "component") {
                        return createComponentProxy(target.component);
                    }
                    return Reflect.get(target, prop, receiver);
                },
            });
        }

        function createNodeProxy(oldNode) {
            return async (...args) => {
                const result = await oldNode(...args);
                return createNodeResultProxy(result);
            };
        }

        function createKitProxy(kit) {
            if (!kit?.start) return [false, kit];

            return [
                true,
                new Proxy(kit, {
                    get(target, prop, receiver) {
                        if (prop === "start") {
                            return function (...args) {
                                const appModule = args[0];
                                const options = args[2];

                                if (
                                    typeof appModule === "object" &&
                                    typeof appModule.nodes === "object" &&
                                    typeof options === "object" &&
                                    typeof options.node_ids === "object"
                                ) {
                                    const nodeIndex = options.node_ids[1];
                                    const oldNode = appModule.nodes[nodeIndex];
                                    appModule.nodes[nodeIndex] =
                                        createNodeProxy(oldNode);
                                }

                                if (debug)
                                    console.log(
                                        "[Debug] kit.start intercepted!",
                                        options,
                                    );
                                return kit.start.apply(this, args);
                            };
                        }
                        return Reflect.get(target, prop, receiver);
                    },
                }),
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
                            if (debug)
                                console.log("[Debug]: Set up Interception!");

                            const [success, created] = createKitProxy(kit);
                            if (success) {
                                Promise.all = origPromiseAll;
                                if (debug)
                                    console.log(
                                        "[Debug]: Kit ready",
                                        created,
                                        app,
                                    );
                            }
                            resolve([created, app, ...args]);
                        });
                    });
                }
                return await result;
            };
        }

        setupInterception();

        window.googletag = { cmd: [], _loaded_: true };

        const hide =
            "W2lkXj0iYnNhLXpvbmVfIl0sCmRpdi5maXhlZC5pbnNldC0wLmJnLWJsYWNrXC81MC5iYWNrZHJvcC1ibHVyLXNtLApkaXYuZG9uZS1iYW5uZXItY29udGFpbmVyLnN2ZWx0ZS0xeWptazFnLAppbnM6bnRoLW9mLXR5cGUoMSksCmRpdjpudGgtb2YtdHlwZSg5KSwKZGl2LmZpeGVkLnRvcC0xNi5sZWZ0LTAucmlnaHQtMC5ib3R0b20tMC5iZy13aGl0ZS56LTQwLm92ZXJmbG93LXktYXV0bywKcFtzdHlsZV0sCi5hZHNieWdvb2dsZSwKLmFkc2Vuc2Utd3JhcHBlciwKLmlubGluZS1hZCwKLmdwdC1iaWxsYm9hcmQtY29udGFpbmVyLAojYmlsbGJvYXJkLTEsCiNiaWxsYm9hcmQtMiwKI2JpbGxib2FyZC0zLAojc2lkZWJhci1hZC0xLAojc2t5c2NyYXBlci1hZC0xIHsKICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsKfQ==";

        const style = document.createElement("style");
        style.textContent =
            typeof atob === "function"
                ? atob(hide)
                : Buffer
                  ? Buffer.from(hide, "base64").toString()
                  : "";
        const appendTarget =
            document.head || document.documentElement || document.body;
        if (appendTarget) {
            appendTarget.appendChild(style);
        } else {
            setTimeout(() => {
                (
                    document.head ||
                    document.documentElement ||
                    document.body
                ).appendChild(style);
            }, 100);
        }

        const ob = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    if (node.classList?.contains("adsbygoogle")) node.remove();
                    node.querySelectorAll?.(".adsbygoogle").forEach((el) =>
                        el.remove(),
                    );

                    if (node.id === "qc-cmp2-container") {
                        if (debug)
                            console.log(
                                "[Debug] Removed privacy container qc-cmp2-container",
                            );
                        node.remove();
                    }
                    node.querySelectorAll?.("#qc-cmp2-container").forEach(
                        (el) => {
                            if (debug)
                                console.log(
                                    "[Debug] Removed privacy container qc-cmp2-container",
                                );
                            el.remove();
                        },
                    );

                    if (
                        node.matches(".button.large.accessBtn.pos-relative") &&
                        node.textContent.includes("Go To Destination")
                    ) {
                        node.click();
                    } else {
                        node.querySelectorAll?.(
                            ".button.large.accessBtn.pos-relative",
                        ).forEach((btn) => {
                            if (btn.textContent.includes("Go To Destination"))
                                btn.click();
                        });
                    }
                }
            }
        });
        if (document.documentElement) {
            ob.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        } else {
            setTimeout(() => {
                ob.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                });
            }, 100);
        }

        setTimeout(() => {
            const existingContainer =
                document.querySelector("#qc-cmp2-container");
            if (existingContainer) {
                if (debug)
                    console.log(
                        "[Debug] Removed existing privacy container qc-cmp2-container",
                    );
                existingContainer.remove();
            }
        });
    }

    function handleLuarmor() {
    if (debug) console.log('[Debug] Luarmor: Handler started');

    let cloudflareAttempted = false;
    let captchaSolved = false;
    let startButtonClicked = false;
    let nextButtonClicked = false; // NEW: Track if Next was clicked
    let checkpointActive = false;
    let currentCheckpoint = 0;
    let isProcessing = false;
    let captchaCheckInterval = null;
    let processComplete = false;

    // Improved button detection and clicking
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(checkInterval);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(null);
                }
            }, 100);
        });
    }

    function isElementClickable(element) {
        if (!element) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const disabled = element.disabled ||
                        element.getAttribute("aria-disabled") === "true" ||
                        element.hasAttribute('disabled') ||
                        element.classList.contains('disabled');
        const visible = style.display !== "none" &&
                       style.visibility !== "hidden" &&
                       style.opacity !== "0" &&
                       element.offsetParent !== null &&
                       rect.width > 0 && rect.height > 0;

        return visible && !disabled;
    }

    async function clickElement(element, description) {
        if (!element) {
            if (debug) console.warn(`[Debug] Luarmor: ${description} - element not found`);
            return false;
        }

        if (debug) console.log(`[Debug] Luarmor: ${description} - attempting click`);

        if (!isElementClickable(element)) {
            if (debug) console.warn(`[Debug] Luarmor: ${description} - element not clickable`);
            return false;
        }

        try {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // REMOVED: await new Promise(resolve => setTimeout(resolve, 500));

            // Try onclick attribute first
            const onclickAttr = element.getAttribute('onclick');
            if (onclickAttr) {
                if (debug) console.log(`[Debug] Luarmor: ${description} - executing onclick`);
                try {
                    const funcMatch = onclickAttr.match(/^(\w+)\(\)/);
                    if (funcMatch && typeof window[funcMatch[1]] === 'function') {
                        window[funcMatch[1]]();
                        if (debug) console.log(`[Debug] Luarmor: ${description} - onclick executed`);
                        return true;
                    }
                } catch (e) {
                    if (debug) console.warn(`[Debug] onclick execution error:`, e);
                }
            }

            element.click();
            if (debug) console.log(`[Debug] Luarmor: ${description} - click executed`);
            return true;
        } catch (err) {
            if (debug) console.error(`[Debug] Luarmor: ${description} - click error:`, err);
            return false;
        }
    }

    // Handle Cloudflare captcha
    async function handleCloudflareCaptcha() {
        if (cloudflareAttempted) return false;

        const isCfChallenge = document.title.includes('Just a moment') ||
                             document.querySelector('#challenge-stage') ||
                             document.querySelector('.cf-browser-verification');

        if (!isCfChallenge) {
            if (debug) console.log('[Debug] Luarmor: Not a Cloudflare page');
            cloudflareAttempted = true;
            return false;
        }

        if (debug) console.log('[Debug] Luarmor: Cloudflare challenge detected');

        await new Promise(resolve => setTimeout(resolve, 3000));

        const cfSelectors = [
            '#challenge-stage button[type="submit"]',
            'button[type="submit"]',
            'input[type="submit"]',
            '.cf-turnstile button'
        ];

        for (const selector of cfSelectors) {
            const cfButton = document.querySelector(selector);
            if (cfButton && isElementClickable(cfButton)) {
                const btnText = (cfButton.textContent || cfButton.value || '').toLowerCase();
                if (btnText.includes('verify') || btnText.includes('continue') || btnText.includes('submit')) {
                    cloudflareAttempted = true;

                    // REMOVED: await new Promise(resolve => setTimeout(resolve, 500));

                    if (await clickElement(cfButton, 'Cloudflare verify')) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        return true;
                    }
                }
            }
        }

        cloudflareAttempted = true;
        return false;
    }

    async function waitForCaptchaSolution() {
        if (captchaSolved) return;

        const isCfPage = document.title.includes('Just a moment') || document.querySelector('#challenge-stage');
        if (!isCfPage) {
            if (debug) console.log('[Debug] Luarmor: Waiting for user to solve CAPTCHA');
        }

        // Clear any existing interval
        if (captchaCheckInterval) {
            clearInterval(captchaCheckInterval);
        }

        let checkCount = 0;
        captchaCheckInterval = setInterval(() => {
            checkCount++;

            // Skip if still on Cloudflare
            const stillOnCf = document.title.includes('Just a moment') || document.querySelector('#challenge-stage');
            if (stillOnCf) return;

            // Method 1: Check for captcha iframe disappearance
            const hcaptchaIframe = document.querySelector('iframe[src*="hcaptcha"]');
            const recaptchaIframe = document.querySelector('iframe[src*="recaptcha"]');
            const turnstileIframe = document.querySelector('iframe[src*="turnstile"]');

            // Method 2: Check for captcha container visibility
            const hcaptchaContainer = document.querySelector('.h-captcha');
            const recaptchaContainer = document.querySelector('.g-recaptcha');

            // Method 3: Check for response tokens
            const hcaptchaResponse = document.querySelector('[name="h-captcha-response"]');
            const recaptchaResponse = document.querySelector('[name="g-recaptcha-response"]');
            const hasToken = (hcaptchaResponse?.value && hcaptchaResponse.value.length > 0) ||
                           (recaptchaResponse?.value && recaptchaResponse.value.length > 0);

            // Method 4: Check if Start button is enabled AND detect its type
            const startBtn = document.querySelector('button#nextbtn');
            let startButtonReady = false;
            let detectedButtonType = null;

            if (startBtn) {
                detectedButtonType = detectButtonType(startBtn);
                const isClickable = isElementClickable(startBtn);

                // Button is ready if it's any valid type and is clickable
                startButtonReady = (detectedButtonType !== null) && isClickable;

                if (debug && checkCount % 10 === 0) {
                    console.log(`[Debug] Button check: type=${detectedButtonType}, clickable=${isClickable}, ready=${startButtonReady}`);
                }
            }

            // Method 5: Check if captcha containers are hidden
            const captchaHidden = (hcaptchaContainer && getComputedStyle(hcaptchaContainer).display === 'none') ||
                                (recaptchaContainer && getComputedStyle(recaptchaContainer).display === 'none');

            // Log detection status periodically
            if (debug && checkCount % 10 === 0) {
                console.log(`[Debug] Captcha check ${checkCount}: token=${hasToken}, btnReady=${startButtonReady}, hidden=${captchaHidden}`);
            }

            // Captcha is solved if ANY of these conditions are true:
            if (hasToken || startButtonReady || captchaHidden) {
                clearInterval(captchaCheckInterval);
                captchaCheckInterval = null;
                captchaSolved = true;

                if (debug) console.log('[Debug] Luarmor: CAPTCHA solved! (token:', hasToken, 'btnReady:', startButtonReady, 'hidden:', captchaHidden, ')');

                setTimeout(() => handleStartButton(), 0);
            }

            // Timeout after 5 minutes
            if (checkCount > 600) {
                clearInterval(captchaCheckInterval);
                captchaCheckInterval = null;
                if (debug) console.warn('[Debug] Luarmor: CAPTCHA check timeout');
            }
        }, 500);
    }

    // Detect button type by icon and check if it's actually ready
    function detectButtonType(button) {
        if (!button) return null;

        const icon = button.querySelector('i.material-icons, i');
        const buttonText = button.textContent.trim();

        if (!icon) {
            if (debug) console.warn('[Debug] No icon found in button');
            return null;
        }

        const iconText = icon.textContent.trim();

        // Check if button is actually enabled/ready
        const isDisabled = button.disabled ||
                          button.classList.contains('disabled') ||
                          button.classList.contains('button-disabled') ||
                          button.getAttribute('aria-disabled') === 'true' ||
                          button.hasAttribute('disabled');

        const style = getComputedStyle(button);
        const isVisible = style.display !== 'none' &&
                         style.visibility !== 'hidden' &&
                         style.opacity !== '0';

        // Check for loading state
        const hasLoader = button.querySelector('.loader, .loader-btn, .spinner');
        const isLoading = hasLoader && (hasLoader.style.display !== 'none');

        if (debug) console.log(`[Debug] Button state - Icon: "${iconText}", Text: "${buttonText}", Disabled: ${isDisabled}, Visible: ${isVisible}, Loading: ${isLoading}`);

        // Don't detect if button is not ready
        if (isDisabled || !isVisible || isLoading) {
            if (debug) console.log('[Debug] Button not ready (disabled, invisible, or loading)');
            return null;
        }

        // Detect button type based on icon
        if (iconText === 'open_in_new' || iconText.includes('open_in_new')) {
            return 'start';
        } else if (iconText === 'fast_forward' || iconText.includes('fast_forward')) {
            return 'next';
        } else if (iconText === 'done' || iconText.includes('done')) {
            return 'done';
        }

        // Fallback to text content
        if (buttonText.includes('Start')) return 'start';
        if (buttonText.includes('Next')) return 'next';
        if (buttonText.includes('Done') || buttonText.includes('Finish')) return 'done';

        if (debug) console.warn(`[Debug] Unknown button type - Icon: "${iconText}", Text: "${buttonText}"`);
        return null;
    }

    // Handle Start/Continue button - ONLY CLICKS ONCE
    async function handleStartButton() {
        if (startButtonClicked || processComplete) {
            if (debug) console.log('[Debug] Luarmor: Start button already clicked or process complete');
            return;
        }

        // REMOVED: await new Promise(resolve => setTimeout(resolve, 1000));

        const startBtn = document.querySelector('button#nextbtn');
        if (!startBtn) {
            if (debug) console.warn('[Debug] Luarmor: Start button not found, retrying...');
            if (!processComplete) setTimeout(handleStartButton, 1500);
            return;
        }

        const buttonType = detectButtonType(startBtn);

        if (debug) console.log(`[Debug] Detected button type: ${buttonType}`);

        if (buttonType === 'start' && isElementClickable(startBtn)) {
            if (debug) console.log('[Debug] Luarmor: Clicking start button');

            startButtonClicked = true; // Mark as clicked BEFORE attempting

            const clickSuccess = await clickElement(startBtn, 'Start button');
            if (clickSuccess) {
                if (debug) console.log('[Debug] Luarmor: Start button clicked successfully - WILL NOT CLICK AGAIN');

                // REMOVED: await new Promise(resolve => setTimeout(resolve, 4000));
                startCheckpointProcess();
            } else {
                if (debug) console.warn('[Debug] Luarmor: Failed to click start button - NOT RETRYING');
            }
        } else if (buttonType === 'next') {
            if (debug) console.log('[Debug] Luarmor: Found Next button, starting checkpoint process');
            startButtonClicked = true;
            startCheckpointProcess();
        } else if (buttonType === 'done') {
            if (debug) console.log('[Debug] Luarmor: Found Done button immediately, completing');
            startButtonClicked = true;
            processComplete = true;
            await handleCompletion();
        } else {
            if (debug) console.warn('[Debug] Luarmor: Button not ready or unknown type, retrying...');
            if (!processComplete) setTimeout(handleStartButton, 1500);
        }
    }

    // Process checkpoints - ONLY CLICKS NEXT ONCE
    async function processNextCheckpoint() {
        if (isProcessing || processComplete || nextButtonClicked) {
            if (debug) console.log('[Debug] Already processing, process complete, or next already clicked');
            return processComplete;
        }

        isProcessing = true;

        try {
            // REMOVED: await new Promise(resolve => setTimeout(resolve, 1000));

            const nextBtn = document.querySelector('button#nextbtn');
            if (!nextBtn) {
                if (debug) console.warn('[Debug] No nextbtn found');
                isProcessing = false;
                return false;
            }

            const buttonType = detectButtonType(nextBtn);

            if (debug) console.log(`[Debug] Processing checkpoint - Button type: ${buttonType}`);

            // If no valid button type detected (button not ready), wait and retry
            if (buttonType === null) {
                if (debug) console.log('[Debug] Button not ready yet, will retry');
                isProcessing = false;
                return false;
            }

            if (buttonType === 'done') {
                if (debug) console.log('[Debug] Luarmor: Found Done button, completing process');
                processComplete = true;
                isProcessing = false;

                // REMOVED: await new Promise(resolve => setTimeout(resolve, 1500));
                await handleCompletion();
                return true;
            }

            if (buttonType === 'next') {
                // Check if we already clicked Next
                if (nextButtonClicked) {
                    if (debug) console.log('[Debug] Next button already clicked - NOT CLICKING AGAIN');
                    isProcessing = false;
                    return false;
                }

                // Double-check the button is actually clickable before attempting
                if (!isElementClickable(nextBtn)) {
                    if (debug) console.log('[Debug] Next button exists but not clickable yet, waiting...');
                    isProcessing = false;
                    return false;
                }

                currentCheckpoint++;
                if (debug) console.log(`[Debug] Clicking Next checkpoint ${currentCheckpoint}`);

                nextButtonClicked = true; // Mark as clicked BEFORE attempting

                if (await clickElement(nextBtn, `Next checkpoint ${currentCheckpoint}`)) {
                    if (debug) console.log(`[Debug] Checkpoint ${currentCheckpoint} clicked successfully - WILL NOT CLICK AGAIN`);

                    // REMOVED: await new Promise(resolve => setTimeout(resolve, 6000));
                    isProcessing = false;
                    return false;
                } else {
                    if (debug) console.warn(`[Debug] Failed to click checkpoint ${currentCheckpoint} - NOT RETRYING`);
                    isProcessing = false;
                    return false;
                }
            }

            // If button is 'start', we shouldn't be here
            if (buttonType === 'start') {
                if (debug) console.error('[Debug] Unexpected: Found start button during checkpoint processing');
                isProcessing = false;
                return false;
            }

            if (debug) console.log(`[Debug] Button type "${buttonType}" not handled, waiting...`);
            isProcessing = false;
            return false;

        } catch (e) {
            if (debug) console.error('[Debug] Luarmor: Error in processNextCheckpoint:', e);
            isProcessing = false;
            return false;
        }
    }

    async function startCheckpointProcess() {
        if (checkpointActive || processComplete) {
            if (debug) console.log('[Debug] Checkpoint process already active or complete');
            return;
        }

        checkpointActive = true;

        if (debug) console.log('[Debug] Luarmor: Starting checkpoint loop');

        async function checkpointLoop() {
            // Stop immediately if process is complete
            if (processComplete) {
                if (debug) console.log('[Debug] Process complete flag detected, stopping loop');
                checkpointActive = false;
                return;
            }

            const completed = await processNextCheckpoint();

            if (completed) {
                if (debug) console.log('[Debug] Luarmor: Checkpoint loop completed - stopping permanently');
                checkpointActive = false;
                processComplete = true;
                return;
            }

            // Only continue if not complete
            if (!processComplete) {
                setTimeout(checkpointLoop, 3000);
            } else {
                if (debug) console.log('[Debug] Process complete, not scheduling next loop');
                checkpointActive = false;
            }
        }

        // Start the loop
        checkpointLoop();
    }

    async function handleCompletion() {
        if (debug) console.log('[Debug] Luarmor: Handling completion');

        // Set completion flag FIRST to stop any loops
        processComplete = true;
        checkpointActive = false;

        if (debug) console.log('[Debug] Set processComplete=true and checkpointActive=false');

        // REMOVED: await new Promise(resolve => setTimeout(resolve, 2000));

        // Look for the "Get New Key" button
        const newKeyBtn = document.querySelector('button#newkeybtn');

        // Also check for copy button as alternative completion indicator
        const copyKeyBtn = document.querySelector('button[onclick*="copy"], .copy-key-btn, #copy-key-btn');

        if (newKeyBtn && isElementClickable(newKeyBtn)) {
            if (debug) console.log('[Debug] Luarmor: Found and clicking new key button');

            if (await clickElement(newKeyBtn, 'Get new key')) {
                if (debug) console.log('[Debug] Luarmor:  Bypass complete - key obtained');
                return;
            }
        } else if (copyKeyBtn) {
            if (debug) console.log('[Debug] Luarmor: Found copy key button, attempting to copy');
            if (await clickElement(copyKeyBtn, 'Copy key')) {
                if (debug) console.log('[Debug] Luarmor:  Key copied successfully');
                return;
            }
        } else {
            if (debug) console.warn('[Debug] Luarmor: No completion button found');
        }

        // CRITICAL: Ensure we absolutely do NOT redirect
        if (debug) console.log('[Debug] Luarmor:  STAYING ON PAGE - NO REDIRECT ');

        // Clear any intervals or timeouts that might cause redirects
        if (captchaCheckInterval) {
            clearInterval(captchaCheckInterval);
            captchaCheckInterval = null;
        }
    }

    // Start the process
    (async () => {
        // REMOVED: await new Promise(resolve => setTimeout(resolve, 1000));
        await handleCloudflareCaptcha();
        await waitForCaptchaSolution();
    })();

    if (debug) console.log('[Debug] Luarmor: Handler initialized');
}
})();
