(function () {
    // DOM utilities
    const qs = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const on = (el, type, handler, opts) => el && el.addEventListener(type, handler, opts);
    const attr = (el, name, value) => (value === undefined ? el.getAttribute(name) : el.setAttribute(name, value));

    // Toast notification helper
    function showToast(message, type = 'info', duration = 2400) {
        const el = qs('#toast');
        if (!el) return;
        el.textContent = message;
        el.className = `toast ${type}`;
        el.removeAttribute('hidden');
        requestAnimationFrame(() => {
            el.classList.add('show');
            setThemeColorMeta();
        });
        window.clearTimeout(el._hideTimer);
        el._hideTimer = window.setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => {
                el.setAttribute('hidden', '');
            }, 300);
        }, duration);
    }

    // Service Worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('sw.js')
                .then(() => {
                    const btnUpdate = qs('#btn-update-app');
                    if (!btnUpdate) return;

                    // Function to perform the update
                    const performUpdate = async () => {
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
                    };

                    on(btnUpdate, 'click', () => {
                        // Show confirmation modal instead of confirm dialog
                        const modal = qs('#modal-update-confirm');
                        if (modal) {
                            modal.classList.add('is-visible');
                            attr(modal, 'aria-hidden', 'false');
                            document.body.classList.add('scroll-lock');
                        }
                    });

                    // Handle cancel button
                    const cancelBtn = qs('#btn-cancel-update');
                    if (cancelBtn) {
                        on(cancelBtn, 'click', () => {
                            const modal = qs('#modal-update-confirm');
                            if (modal) {
                                modal.classList.remove('is-visible');
                                attr(modal, 'aria-hidden', 'true');
                                document.body.classList.remove('scroll-lock');
                            }
                        });
                    }

                    // Handle close button (X)
                    const closeBtn = qs('#btn-modal-close-update-confirm');
                    if (closeBtn) {
                        on(closeBtn, 'click', () => {
                            const modal = qs('#modal-update-confirm');
                            if (modal) {
                                modal.classList.remove('is-visible');
                                attr(modal, 'aria-hidden', 'true');
                                document.body.classList.remove('scroll-lock');
                            }
                        });
                    }

                    // Handle confirm button
                    const confirmBtn = qs('#btn-confirm-update');
                    if (confirmBtn) {
                        on(confirmBtn, 'click', async () => {
                            // Close modal first
                            const modal = qs('#modal-update-confirm');
                            if (modal) {
                                modal.classList.remove('is-visible');
                                attr(modal, 'aria-hidden', 'true');
                                document.body.classList.remove('scroll-lock');
                            }
                            // Perform the update
                            await performUpdate();
                        });
                    }
                })
                .catch((error) => console.warn('Service Worker registration failed:', error));
        });
    }

    // Theme management
    const THEME_KEY = 'theme';

    // Keep the browser UI color in sync with our themed header color
    const setThemeColorMeta = () => {
        try {
            let meta = document.querySelector('meta[name="theme-color"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'theme-color');
                document.head.appendChild(meta);
            }
            const cs = getComputedStyle(document.documentElement);
            const headerColor = (cs.getPropertyValue('--color-header') || '').trim() || '#14B8A6';
            meta.setAttribute('content', headerColor);
        } catch { /* noop */ }
    };

    const setTheme = (next) => {
        attr(document.documentElement, 'data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
        // Update theme-color after the DOM applies the new theme variables
        requestAnimationFrame(setThemeColorMeta);
    };

    // Modal dialog functionality
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
                'base-converter': 'home'
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

    // Enhance native <select> to custom dropdown matching mobile nav
    function enhanceSelect(nativeSelect) {
        if (!nativeSelect) return null;
        if (nativeSelect._enhanced) return nativeSelect._enhanced; // idempotent

        // Build structure: wrapper, trigger, dropdown
        const wrapper = document.createElement('div');
        wrapper.className = 'select-container';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        const updateTriggerLabel = () => {
            const selOpt = nativeSelect.options[nativeSelect.selectedIndex];
            trigger.textContent = selOpt ? selOpt.textContent : '';
        };
        updateTriggerLabel();

        const dropdown = document.createElement('div');
        dropdown.className = 'mobile-nav-dropdown select-dropdown';
        dropdown.setAttribute('role', 'listbox');
        const ddId = `${nativeSelect.id || 'select'}-dropdown`;
        dropdown.id = ddId;
        trigger.setAttribute('aria-controls', ddId);

        // Build options
        const buildOptions = () => {
            dropdown.innerHTML = '';
            Array.from(nativeSelect.options).forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'mobile-nav-link';
                btn.type = 'button';
                btn.setAttribute('role', 'option');
                btn.setAttribute('data-value', opt.value);
                btn.textContent = opt.textContent;
                if (idx === nativeSelect.selectedIndex) btn.classList.add('active');
                on(btn, 'click', () => {
                    nativeSelect.value = opt.value;
                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    updateTriggerLabel();
                    closeDropdown();
                    syncActive();
                    trigger.focus();
                });
                dropdown.appendChild(btn);
            });
        };
        buildOptions();

        // Insert DOM: replace native select visually but keep it for form semantics
        nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
        wrapper.appendChild(nativeSelect);
        wrapper.appendChild(trigger);
        wrapper.appendChild(dropdown);

        nativeSelect.classList.add('visually-hidden-select');

        // Open/close behavior
        const openDropdown = () => {
            if (dropdown.classList.contains('is-visible')) return;
            dropdown.classList.add('is-visible');
            trigger.setAttribute('aria-expanded', 'true');
            // Focus first or active item
            const items = Array.from(dropdown.querySelectorAll('.mobile-nav-link'));
            const activeIdx = items.findIndex(el => el.classList.contains('active'));
            const focusIdx = activeIdx >= 0 ? activeIdx : 0;
            items[focusIdx]?.focus();
        };
        const closeDropdown = () => {
            if (!dropdown.classList.contains('is-visible')) return;
            dropdown.classList.remove('is-visible');
            trigger.setAttribute('aria-expanded', 'false');
        };

        on(trigger, 'click', (e) => {
            e.stopPropagation();
            dropdown.classList.contains('is-visible') ? closeDropdown() : openDropdown();
        });

        on(document, 'click', (e) => {
            if (!wrapper.contains(e.target)) closeDropdown();
        });

        on(wrapper, 'keydown', (e) => {
            const items = Array.from(dropdown.querySelectorAll('.mobile-nav-link'));
            const currentIndex = items.indexOf(document.activeElement);
            if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); trigger.focus(); }
            else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === trigger) {
                e.preventDefault(); openDropdown();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!dropdown.classList.contains('is-visible')) { openDropdown(); return; }
                const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
                items[next]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!dropdown.classList.contains('is-visible')) { openDropdown(); return; }
                const prev = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
                items[prev]?.focus();
            } else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && items.includes(document.activeElement)) {
                e.preventDefault();
                document.activeElement.click();
            }
        });

        // Sync active class with select value
        const syncActive = () => {
            const val = nativeSelect.value;
            dropdown.querySelectorAll('.mobile-nav-link').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-value') === val);
            });
        };

        on(nativeSelect, 'change', () => {
            updateTriggerLabel();
            syncActive();
        });

        nativeSelect._enhanced = { wrapper, trigger, dropdown, rebuild: buildOptions };
        return nativeSelect._enhanced;
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
        const swapBtn = qs('#swap-bases');

        if (form && inputEl && fromEl && toEl && resultEl) {
            // Enhance dropdowns to match mobile nav style
            if (fromEl.classList.contains('enhance-dropdown')) enhanceSelect(fromEl);
            if (toEl.classList.contains('enhance-dropdown')) enhanceSelect(toEl);
            // Prevent form submission (e.g., Enter key) from reloading the page
            on(form, 'submit', (e) => { e.preventDefault(); });

            const performConversion = () => {
                const inputValue = inputEl.value.trim();
                const fromBase = parseInt(fromEl.value, 10);
                const toBase = parseInt(toEl.value, 10);

                if (!inputValue) {
                    resultEl.textContent = '';
                    return;
                }

                try {
                    const value = BaseConverter.convert(inputValue, fromBase, toBase);
                    resultEl.textContent = value;
                } catch (err) {
                    resultEl.textContent = 'Invalid input for selected base';
                }
            };

            // Live conversion on input and base changes
            on(inputEl, 'input', performConversion);
            on(fromEl, 'change', performConversion);
            on(toEl, 'change', performConversion);

            // Initial compute to populate result
            performConversion();
        }

        // Swap button: exchange selected bases and trigger conversion
        if (swapBtn && fromEl && toEl) {
            on(swapBtn, 'click', () => {
                const tmp = fromEl.value;
                fromEl.value = toEl.value;
                toEl.value = tmp;
                // Notify enhanced selects and trigger conversion
                fromEl.dispatchEvent(new Event('change', { bubbles: true }));
                toEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }

        // Temporary success icon swap for copy button
        function indicateCopied(btn) {
            if (!btn) return;
            const icon = btn.querySelector('.material-symbols-rounded');
            if (!icon) return;
            // Clear any prior timer
            if (btn._revertTimer) {
                clearTimeout(btn._revertTimer);
                btn._revertTimer = null;
            }
            const prevText = icon.textContent;
            const prevTitle = btn.title;
            const prevAria = btn.getAttribute('aria-label');
            btn.classList.add('copied');
            icon.textContent = 'check';
            btn.title = 'Copied!';
            btn.setAttribute('aria-label', 'Copied');
            btn._revertTimer = setTimeout(() => {
                icon.textContent = prevText || 'content_copy';
                btn.title = prevTitle || 'Copy to clipboard';
                btn.setAttribute('aria-label', prevAria || 'Copy to clipboard');
                btn.classList.remove('copied');
                btn._revertTimer = null;
            }, 1200);
        }

        if (copyBtn) {
            on(copyBtn, 'click', async () => {
                const text = (qs('#solution')?.innerText || '').trim();
                if (!text) { showToast('Nothing to copy', 'info'); return; }
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                        showToast('Copied', 'success');
                        indicateCopied(copyBtn);
                    } else {
                        // Fallback
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.position = 'fixed';
                        ta.style.left = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        const ok = document.execCommand('copy');
                        document.body.removeChild(ta);
                        if (ok) { showToast('Copied', 'success'); indicateCopied(copyBtn); } else { showToast('Copy failed', 'error'); }
                    }
                } catch (e) {
                    showToast('Copy failed', 'error');
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