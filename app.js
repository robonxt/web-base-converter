(function () {
    // Utils
    const qs = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const on = (el, type, handler, opts) => el && el.addEventListener(type, handler, opts);
    const attr = (el, name, value) => (value === undefined ? el.getAttribute(name) : el.setAttribute(name, value));

    // Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('sw.js')
                .then(() => {
                    const btnUpdate = qs('#btn-update-app');
                    if (!btnUpdate) return;
                    on(btnUpdate, 'click', async () => {
                        if (!confirm('This will clear ALL cached data (including preferences) and force a fresh update. Continue?')) return;
                        try {
                            localStorage.clear();
                            const cacheNames = await caches.keys();
                            await Promise.all(cacheNames.map((name) => caches.delete(name)));
                            const registration = await navigator.serviceWorker.getRegistration();
                            if (registration) await registration.unregister();
                            window.location.reload(true);
                        } catch (error) {
                            console.error('Update failed:', error);
                            alert('Update failed. Please check console for details.');
                        }
                    });
                })
                .catch((error) => console.warn('Service Worker registration failed:', error));
        });
    }

    // Theme
    const THEME_KEY = 'theme';
    const setTheme = (next) => {
        attr(document.documentElement, 'data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    };

    // Modal
    function bindModal(triggerBtn, modalEl, closeBtn) {
        if (!modalEl) return;
        const dialog = modalEl.querySelector('.modal-dialog');
        let lastFocus = null;
        const focusableElements = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = Array.from(modalEl.querySelectorAll(focusableElements));
            if (!focusable.length) return e.preventDefault();
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };

        const onEsc = (e) => { if (e.key === 'Escape') close(); };

        const open = () => {
            lastFocus = document.activeElement;
            modalEl.classList.add('is-visible');
            attr(modalEl, 'aria-hidden', 'false');
            document.body.classList.add('scroll-lock');
            on(document, 'keydown', trapFocus);
            on(document, 'keydown', onEsc);
            const firstFocusable = modalEl.querySelector(focusableElements);
            (firstFocusable || dialog || modalEl).focus();
        };

        const close = () => {
            modalEl.classList.remove('is-visible');
            attr(modalEl, 'aria-hidden', 'true');
            document.body.classList.remove('scroll-lock');
            document.removeEventListener('keydown', trapFocus);
            document.removeEventListener('keydown', onEsc);
            if (lastFocus && typeof lastFocus.focus === 'function') {
                lastFocus.focus();
            }
        };

        on(triggerBtn, 'click', open);
        on(closeBtn, 'click', close);
        on(modalEl, 'click', (e) => { if (e.target === modalEl) close(); });
    }

    // Converter: helper data and functions (UI only, logic in base-converter.js)
    const conversionInfo = {
        '2-8': 'Binary to Octal:\nGroup binary digits into sets of 3 (from right) and convert each group to octal.\nExample: 101011\nGroup into threes: 101 011\n101 = 5, 011 = 3\nResult: 53',
        '2-10': 'Binary to Decimal:\nMultiply each binary digit by 2 raised to its position power (from right, starting at 0) and sum.\nExample: 1011\n1×2³ + 0×2² + 1×2¹ + 1×2⁰\n8 + 0 + 2 + 1 = 11',
        '2-16': 'Binary to Hexadecimal:\nGroup binary digits into sets of 4 (from right) and convert each group to hex.\nExample: 101111\nGroup into fours: 10 1111\n10 = 2, 1111 = F\nResult: 2F',
        '8-2': 'Octal to Binary:\nConvert each octal digit to its 3-digit binary equivalent.\nExample: 27\n2 → 010, 7 → 111\nResult: 010111',
        '8-10': 'Octal to Decimal:\nMultiply each octal digit by 8 raised to its position power (from right, starting at 0) and sum.\nExample: 37\n3×8¹ + 7×8⁰\n24 + 7 = 31',
        '8-16': 'Octal to Hexadecimal:\nFirst convert to binary, then group into sets of 4 and convert to hex.\nExample: 27\n27 → 010111 → Group into fours: 0010 1111\n0010 = 2, 1111 = F\nResult: 2F',
        '10-2': 'Decimal to Binary:\nRepeatedly divide by 2 and record remainders in reverse order.\nExample: 13\n13 ÷ 2 = 6 remainder 1\n6 ÷ 2 = 3 remainder 0\n3 ÷ 2 = 1 remainder 1\n1 ÷ 2 = 0 remainder 1\nResult (reading remainders bottom-up): 1101',
        '10-8': 'Decimal to Octal:\nRepeatedly divide by 8 and record remainders in reverse order.\nExample: 59\n59 ÷ 8 = 7 remainder 3\n7 ÷ 8 = 0 remainder 7\nResult (reading remainders bottom-up): 73',
        '10-16': 'Decimal to Hexadecimal:\nRepeatedly divide by 16 and record remainders (10=A, 11=B, 12=C, 13=D, 14=E, 15=F) in reverse order.\nExample: 43\n43 ÷ 16 = 2 remainder 11(B)\n2 ÷ 16 = 0 remainder 2\nResult (reading remainders bottom-up): 2B',
        '16-2': 'Hexadecimal to Binary:\nConvert each hex digit to its 4-digit binary equivalent.\nExample: 2F\n2 → 0010, F → 1111\nResult: 00101111',
        '16-8': 'Hexadecimal to Octal:\nFirst convert to binary, then group into sets of 3 and convert to octal.\nExample: 2F\n2F → 00101111 → Group into threes: 000 101 111\n000 = 0, 101 = 5, 111 = 7\nResult: 057',
        '16-10': 'Hexadecimal to Decimal:\nMultiply each hex digit by 16 raised to its position power (from right, starting at 0) and sum.\nExample: 2F\n2×16¹ + F(15)×16⁰\n32 + 15 = 47'
    };

    function updateConversionInfo(steps) {
        const stepsContainer = qs('#conversionSteps');
        if (!stepsContainer) return;
        stepsContainer.innerHTML = steps
            .map(step => `<div class="conversion-step">${step}</div>`)
            .join('');
    }

    function updateInfo(fromBase, toBase) {
        const key = `${fromBase}-${toBase}`;
        const steps = conversionInfo[key] ? conversionInfo[key].split('\n') : ['Select different bases to see conversion methods.'];
        updateConversionInfo(steps);
    }

    // Tabs
    function initTabs() {
        const tabContainer = qs('#wrapper-tabs');
        if (!tabContainer) return;

        const tabs = qsa('.tab-button', tabContainer);
        const slider = qs('.tab-slider', tabContainer);
        const contents = qsa('.content-section[data-content]');

        function moveSlider(targetTab) {
            if (!targetTab || !slider) return;
            const targetRect = targetTab.getBoundingClientRect();
            const containerRect = tabContainer.getBoundingClientRect();

            const width = targetRect.width;
            const transform = `translateX(${targetRect.left - containerRect.left}px)`;

            slider.style.width = `${width}px`;
            slider.style.transform = transform;
        }

        function activate(tab, isInitial = false) {
            if (!tab) return;
            const tabName = attr(tab, 'data-tab');

            if (isInitial) {
                slider.style.transition = 'none'; // Disable transition for initial set
            }

            moveSlider(tab);

            if (isInitial) {
                setTimeout(() => slider.style.transition = '', 50); // Re-enable after a tick
            }

            tabs.forEach(t => t.classList.toggle('active', t === tab));
            contents.forEach(c => {
                c.hidden = attr(c, 'data-content') !== tabName;
            });
        }

        function onHashChange(isInitial = false) {
            const tabName = location.hash.slice(1);
            const targetTab = qs(`.tab-button[data-tab="${tabName}"]`) || tabs[0];
            activate(targetTab, isInitial);
        }

        tabs.forEach(tab => on(tab, 'click', () => {
            const tabName = attr(tab, 'data-tab');
            if (`#${tabName}` !== location.hash) {
                location.hash = tabName;
            }
        }));

        on(window, 'hashchange', () => onHashChange(false));
        onHashChange(true); // Initial activation

        // Resize
        on(window, 'resize', () => {
            const activeTab = qs('.tab-button.active');
            moveSlider(activeTab);
        });
    }

    // Mobile nav
    function initMobileNav() {
        const container = qs('.mobile-nav');
        if (!container) return;

        const toggleBtn = qs('#btn-mobile-nav');
        const dropdown = qs('#mobile-nav-dropdown');
        const titleEl = qs('#mobile-nav-title');
        const mainTabs = qsa('.tab-button[data-tab]');

        // Build dropdown from tabs
        dropdown.innerHTML = '';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-labelledby', 'btn-mobile-nav');
        mainTabs.forEach((tab, idx) => {
            const tabName = attr(tab, 'data-tab');
            const link = document.createElement('button');
            attr(link, 'role', 'menuitem');
            attr(link, 'data-tab', tabName);
            link.className = 'mobile-nav-link';
            const iconMap = {
                home: 'home',
                about: 'info',
                contact: 'mail'
            };
            const iconName = iconMap[tabName] || 'chevron_right';
            const icon = document.createElement('span');
            icon.className = 'material-symbols-rounded menu-icon';
            icon.textContent = iconName;
            const label = document.createElement('span');
            label.className = 'menu-label';
            label.textContent = tab.textContent;
            link.appendChild(icon);
            link.appendChild(label);
            link.type = 'button';
            link.tabIndex = -1;
            on(link, 'click', () => {
                if (`#${tabName}` !== location.hash) {
                    location.hash = tabName;
                }
                closeDropdown();
            });
            dropdown.appendChild(link);
            if (idx < mainTabs.length - 1) {
                const divider = document.createElement('div');
                divider.className = 'menu-divider';
                divider.setAttribute('role', 'separator');
                dropdown.appendChild(divider);
            }
        });

        const mobileLinks = qsa('.mobile-nav-link', dropdown);

        // Visibility
        const focusFirstItem = () => {
            const first = mobileLinks[0];
            if (first) first.focus();
        };

        const openDropdown = () => {
            dropdown.classList.add('is-visible');
            attr(toggleBtn, 'aria-expanded', 'true');
            setTimeout(focusFirstItem, 0);
        };
        const closeDropdown = () => {
            dropdown.classList.remove('is-visible');
            attr(toggleBtn, 'aria-expanded', 'false');
            toggleBtn.focus();
        };

        on(toggleBtn, 'click', (e) => {
            e.stopPropagation();
            dropdown.classList.contains('is-visible') ? closeDropdown() : openDropdown();
        });

        on(toggleBtn, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dropdown.classList.contains('is-visible') ? closeDropdown() : openDropdown();
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!dropdown.classList.contains('is-visible')) openDropdown();
                setTimeout(focusFirstItem, 0);
            }
        });

        on(document, 'click', (e) => {
            if (!container.contains(e.target)) {
                closeDropdown();
            }
        });

        on(dropdown, 'keydown', (e) => {
            const currentIndex = mobileLinks.indexOf(document.activeElement);
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDropdown();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = currentIndex < 0 ? 0 : (currentIndex + 1) % mobileLinks.length;
                mobileLinks[next]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = currentIndex < 0 ? mobileLinks.length - 1 : (currentIndex - 1 + mobileLinks.length) % mobileLinks.length;
                mobileLinks[prev]?.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                mobileLinks[0]?.focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                mobileLinks[mobileLinks.length - 1]?.focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                // Activate focused item
                if (document.activeElement && document.activeElement.classList.contains('mobile-nav-link')) {
                    e.preventDefault();
                    document.activeElement.click();
                }
            }
        });

        // Sync active state
        const syncActiveState = () => {
            const currentTabName = location.hash.slice(1) || attr(mainTabs[0], 'data-tab');
            const activeTab = qs(`.tab-button[data-tab="${currentTabName}"]`);

            // Sync dropdown links
            mobileLinks.forEach(link => {
                link.classList.toggle('active', attr(link, 'data-tab') === currentTabName);
            });

            // Sync mobile title
            if (titleEl && activeTab) {
                titleEl.textContent = activeTab.textContent;
            }
        };

        on(window, 'hashchange', syncActiveState);
        syncActiveState();
    }

    // Init
    function initUI() {
        initTabs();
        initMobileNav();
        bindModal(qs('#btn-show-settings'), qs('#modal-settings'), qs('#btn-modal-close-settings'));
        bindModal(qs('#btn-show-info'), qs('#modal-info'), qs('#btn-modal-close-info'));

        on(qs('#btn-toggle-theme'), 'click', () => {
            const current = attr(document.documentElement, 'data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });

        // Converter wiring
        const form = qs('#converter-form');
        const inputEl = qs('#inputValue');
        const fromEl = qs('#fromBase');
        const toEl = qs('#toBase');
        const resultEl = qs('#solution');
        const copyBtn = qs('#copy-solution');

        if (form && inputEl && fromEl && toEl && resultEl) {
            on(form, 'submit', (e) => {
                e.preventDefault();
                const inputValue = inputEl.value.trim();
                const fromBase = parseInt(fromEl.value, 10);
                const toBase = parseInt(toEl.value, 10);
                try {
                    const value = BaseConverter.convert(inputValue, fromBase, toBase);
                    resultEl.textContent = value;
                } catch (err) {
                    resultEl.textContent = 'Invalid input for selected base';
                }
                updateInfo(fromBase, toBase);
            });

            on(fromEl, 'change', () => updateInfo(parseInt(fromEl.value, 10), parseInt(toEl.value, 10)));
            on(toEl, 'change', () => updateInfo(parseInt(fromEl.value, 10), parseInt(toEl.value, 10)));
            // Initial info
            updateInfo(parseInt(fromEl.value, 10), parseInt(toEl.value, 10));
        }

        if (copyBtn) {
            on(copyBtn, 'click', async () => {
                const text = (qs('#solution')?.innerText || '').trim();
                if (!text) return;
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        // Fallback
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.position = 'fixed';
                        ta.style.left = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                } catch {
                    // no-op
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();