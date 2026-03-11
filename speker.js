// ===========================================
// 📢 PARAGRAPH TEXT-TO-SPEECH SELECTOR (FIXED)
// ===========================================

(function() {
    // Wait for the page to load completely
    setTimeout(() => {

        // Track panel state
        let isPanelOpen = false;
        let currentAudio = null;
        let isPlaying = false;
        let isPaused = false;
        let currentUtterance = null; // For native speech

        // ========== ADD BUTTON TO READING CONTROLS ==========
        function addTTSButtonToControls() {
            const readingControls = document.querySelector('.reading-controls');
            if (!readingControls) {
                console.log('Reading controls not found, retrying...');
                setTimeout(addTTSButtonToControls, 1000);
                return;
            }

            // Check if button already exists
            if (document.getElementById('tts-panel-toggle')) return;

            // Create the button
            const ttsButton = document.createElement('button');
            ttsButton.id = 'tts-panel-toggle';
            ttsButton.className = 'control-btn';
            ttsButton.innerHTML = '<i class="fas fa-headphones"></i> <span>Listen</span>';
            ttsButton.title = 'Open paragraph listener';

            // Add click event to toggle panel
            ttsButton.addEventListener('click', toggleTTSPanel);

            // Add to reading controls (at the beginning)
            readingControls.insertBefore(ttsButton, readingControls.firstChild);

            console.log('✅ TTS button added to reading controls');
        }

        // ========== TOGGLE PANEL ==========
        function toggleTTSPanel() {
            const panel = document.getElementById('draggable-speech-panel');
            const button = document.getElementById('tts-panel-toggle');

            if (panel) {
                // Panel exists, remove it
                panel.remove();
                isPanelOpen = false;
                if (button) {
                    button.classList.remove('active');
                    button.innerHTML = '<i class="fas fa-headphones"></i> <span>Listen</span>';
                }
                // Stop any playing audio
                stopCurrentAudio();
            } else {
                // Create new panel
                createDraggableSpeechPanel();
                isPanelOpen = true;
                if (button) {
                    button.classList.add('active');
                    button.innerHTML = '<i class="fas fa-headphones"></i> <span>Close</span>';
                }
            }
        }

        // ========== STOP CURRENT AUDIO ==========
        function stopCurrentAudio() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }

            // Stop native speech
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }

            isPlaying = false;
            isPaused = false;

            // Update UI
            updatePlayPauseButtons();
            removeParagraphHighlight();
        }

        // ========== UPDATE PLAY/PAUSE BUTTONS ==========
        function updatePlayPauseButtons() {
            const playBtn = document.getElementById('play-paragraph');
            const pauseBtn = document.getElementById('pause-paragraph');
            const stopBtn = document.getElementById('stop-paragraph');
            const statusEl = document.getElementById('speech-status');

            if (!playBtn || !pauseBtn || !stopBtn) return;

            if (isPlaying) {
                playBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (statusEl) statusEl.textContent = 'Playing...';
            } else if (isPaused) {
                playBtn.disabled = true;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                stopBtn.disabled = false;
                if (statusEl) statusEl.textContent = 'Paused';
            } else {
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (statusEl) statusEl.textContent = 'Ready';
            }
        }

        // ========== PLAY WITH GOOGLE TTS API (FIXED) ==========
        async function playWithGoogleTTS(text, language, rate) {
            try {
                // Stop any current audio
                stopCurrentAudio();

                // Update status
                const statusEl = document.getElementById('speech-status');
                if (statusEl) statusEl.textContent = 'Loading audio...';

                // Map language codes for Google TTS
                const langMap = {
                    'en': 'en', 'ar': 'ar', 'fr': 'fr', 'es': 'es',
                    'de': 'de', 'ru': 'ru', 'zh': 'zh', 'ja': 'ja',
                    'hi': 'hi', 'tr': 'tr', 'fa': 'fa', 'ur': 'ur'
                };

                const ttsLang = langMap[language] || 'en';

                // ⭐⭐⭐ تقسيم النص إلى أجزاء صغيرة (Google TTS له حد)
                const maxLength = 200; // Google TTS maximum characters per request
                const textParts = splitTextIntoParts(text, maxLength);

                if (statusEl) statusEl.textContent = `Playing part 1/${textParts.length}...`;

                // تشغيل الأجزاء بالتسلسل
                await playAudioParts(textParts, ttsLang, rate, 0, statusEl);

            } catch (error) {
                console.error('Google TTS error:', error);
                // Fallback to native speech
                useNativeSpeech(text, language, rate);
            }
        }

        // ⭐⭐⭐ دالة لتقسيم النص إلى أجزاء
        function splitTextIntoParts(text, maxLength) {
            const parts = [];
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

            let currentPart = '';

            for (const sentence of sentences) {
                if ((currentPart + sentence).length <= maxLength) {
                    currentPart += sentence;
                } else {
                    if (currentPart) parts.push(currentPart.trim());
                    currentPart = sentence;
                }
            }

            if (currentPart) parts.push(currentPart.trim());

            // إذا كان النص طويلاً جداً، قسمه بالقوة
            if (parts.length === 0) {
                for (let i = 0; i < text.length; i += maxLength) {
                    parts.push(text.substring(i, i + maxLength));
                }
            }

            return parts;
        }

        // ⭐⭐⭐ دالة لتشغيل الأجزاء بالتسلسل
        async function playAudioParts(parts, language, rate, index, statusEl) {
            if (index >= parts.length) {
                // انتهى التشغيل
                isPlaying = false;
                isPaused = false;
                currentAudio = null;
                updatePlayPauseButtons();
                removeParagraphHighlight();
                if (statusEl) statusEl.textContent = 'Finished';
                showNotification('✅ Finished speaking', 'success');
                return;
            }

            const part = parts[index];

            // Google TTS URL
            const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(part)}&tl=${language}&client=tw-ob&ttsspeed=${rate}`;

            // Your proxy URL
            const proxyUrl = `https://muddy-sun-2d2f.zasmimaz.workers.dev/?url=${encodeURIComponent(googleTTSUrl)}`;

            // Create audio element
            const audio = new Audio();
            audio.src = proxyUrl;
            audio.crossOrigin = "anonymous";

            // Event handlers
            audio.onplay = () => {
                isPlaying = true;
                isPaused = false;
                updatePlayPauseButtons();
                highlightCurrentParagraph();
            };

            audio.onended = () => {
                // تشغيل الجزء التالي
                if (statusEl && index < parts.length - 1) {
                    statusEl.textContent = `Playing part ${index + 2}/${parts.length}...`;
                }
                playAudioParts(parts, language, rate, index + 1, statusEl);
            };

            audio.onerror = (e) => {
                console.error('Audio error for part', index, e);
                // جرب الجزء التالي حتى لو فشل هذا
                playAudioParts(parts, language, rate, index + 1, statusEl);
            };

            // Store audio reference
            currentAudio = audio;

            // Play
            try {
                await audio.play();
            } catch (playError) {
                console.error('Play error:', playError);
                // إذا فشل التشغيل، استخدم native speech
                useNativeSpeech(parts.join(' '), language, rate);
            }
        }

        // ========== FALLBACK: NATIVE SPEECH (محسّن) ==========
        function useNativeSpeech(text, language, rate) {
            if (!('speechSynthesis' in window)) {
                showNotification('Text-to-speech not supported', 'error');
                return;
            }

            // Stop any current speech
            window.speechSynthesis.cancel();

            const statusEl = document.getElementById('speech-status');

            // Map language codes
            const langMap = {
                'en': 'en-US', 'ar': 'ar-SA', 'fr': 'fr-FR', 'es': 'es-ES',
                'de': 'de-DE', 'ru': 'ru-RU', 'zh': 'zh-CN', 'ja': 'ja-JP',
                'hi': 'hi-IN', 'tr': 'tr-TR', 'fa': 'fa-IR', 'ur': 'ur-PK'
            };

            // ⭐⭐⭐ تقسيم النص الطويل إلى أجزاء للنطق الطبيعي
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langMap[language] || 'en-US';
            utterance.rate = rate;
            utterance.pitch = 1;
            utterance.volume = 1;

            // اختيار أفضل صوت متاح
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const voice = voices.find(v => v.lang.startsWith(language)) ||
                             voices.find(v => v.lang === 'en-US') ||
                             voices[0];
                utterance.voice = voice;
            }

            utterance.onstart = () => {
                isPlaying = true;
                isPaused = false;
                updatePlayPauseButtons();
                highlightCurrentParagraph();
                if (statusEl) statusEl.textContent = 'Playing (native)...';
            };

            utterance.onpause = () => {
                isPlaying = false;
                isPaused = true;
                updatePlayPauseButtons();
                if (statusEl) statusEl.textContent = 'Paused';
            };

            utterance.onresume = () => {
                isPlaying = true;
                isPaused = false;
                updatePlayPauseButtons();
                if (statusEl) statusEl.textContent = 'Playing (native)...';
            };

            utterance.onend = () => {
                isPlaying = false;
                isPaused = false;
                currentUtterance = null;
                updatePlayPauseButtons();
                removeParagraphHighlight();
                if (statusEl) statusEl.textContent = 'Finished';
                showNotification('✅ Finished speaking', 'success');
            };

            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                isPlaying = false;
                isPaused = false;
                currentUtterance = null;
                updatePlayPauseButtons();
                removeParagraphHighlight();
                if (statusEl) statusEl.textContent = 'Error';
            };

            currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        }

        // ========== HIGHLIGHT CURRENT PARAGRAPH ==========
        function highlightCurrentParagraph() {
            const selector = document.getElementById('paragraph-selector');
            if (!selector) return;

            const selectedIndex = parseInt(selector.value);
            if (isNaN(selectedIndex)) return;

            document.querySelectorAll('.paragraph').forEach((p, i) => {
                if (i === selectedIndex) {
                    p.style.backgroundColor = 'rgba(79, 70, 229, 0.15)';
                    p.style.borderLeft = '4px solid var(--primary)';
                    p.style.transition = 'all 0.3s';

                    // Scroll into view if needed
                    p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    p.style.backgroundColor = '';
                    p.style.borderLeft = '';
                }
            });
        }

        function removeParagraphHighlight() {
            document.querySelectorAll('.paragraph').forEach(p => {
                p.style.backgroundColor = '';
                p.style.borderLeft = '';
            });
        }

        // ========== CREATE DRAGGABLE PANEL ==========
        function createDraggableSpeechPanel() {
            // Check if panel already exists
            if (document.getElementById('draggable-speech-panel')) return;

            // Create panel container
            const panel = document.createElement('div');
            panel.id = 'draggable-speech-panel';
            panel.className = 'draggable-panel';
            panel.innerHTML = `
                <div class="panel-header" id="drag-handle">
                    <i class="fas fa-headphones"></i>
                    <span>Paragraph Listener</span>
                    <div class="header-controls">
                        <button id="minimize-panel" class="panel-control minimize-btn">−</button>
                        <button id="close-speech-panel" class="panel-control close-btn">×</button>
                    </div>
                </div>
                <div class="panel-content">
                    <div class="panel-section">
                        <select id="paragraph-selector" class="speech-select">
                            <option value="">-- Select a paragraph --</option>
                        </select>
                    </div>

                    <div class="panel-section">
                        <div class="speech-controls">
                            <button id="play-paragraph" class="speech-btn play-btn" disabled title="Play">
                                <i class="fas fa-play"></i>
                            </button>
                            <button id="pause-paragraph" class="speech-btn pause-btn" disabled title="Pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button id="stop-paragraph" class="speech-btn stop-btn" disabled title="Stop">
                                <i class="fas fa-stop"></i>
                            </button>
                        </div>
                    </div>

                    <div class="panel-section">
                        <div class="slider-container">
                            <label>
                                <i class="fas fa-tachometer-alt"></i>
                                <span>Speed:</span>
                                <input type="range" id="speech-rate" min="0.5" max="2" step="0.1" value="1">
                                <span id="rate-value">1.0x</span>
                            </label>
                        </div>

                        <div class="language-selector">
                            <label>
                                <i class="fas fa-language"></i>
                                <span>Language:</span>
                                <select id="speech-language">
                                    <option value="en">English</option>
                                    <option value="ar">Arabic</option>
                                    <option value="fr">French</option>
                                    <option value="es">Spanish</option>
                                    <option value="de">German</option>
                                    <option value="ru">Russian</option>
                                    <option value="zh">Chinese</option>
                                    <option value="ja">Japanese</option>
                                    <option value="hi">Hindi</option>
                                    <option value="tr">Turkish</option>
                                    <option value="fa">Persian</option>
                                    <option value="ur">Urdu</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div class="panel-section">
                        <div id="current-paragraph-text" class="current-paragraph-text">
                            <i class="fas fa-quote-right"></i>
                            <span>No paragraph selected</span>
                        </div>
                    </div>

                    <div class="panel-section status-bar">
                        <span id="speech-status">Ready</span>
                        <span id="word-count">0 words</span>
                    </div>
                </div>
            `;

            // Add styles (نفس الـ CSS السابق)
            addStyles();

            document.body.appendChild(panel);

            // Make panel draggable
            makeDraggable(panel);

            // Initialize panel functionality
            initializePanel();
        }

        // ========== ADD STYLES ==========
        function addStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .draggable-panel {
                    position: fixed;
                    top: 100px;
                    left: 20px;
                    width: 340px;
                    background: var(--bg, #ffffff);
                    border: 2px solid var(--primary, #4f46e5);
                    border-radius: 16px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.25);
                    z-index: 10000;
                    font-family: inherit;
                    user-select: none;
                    backdrop-filter: blur(10px);
                    background: rgba(255, 255, 255, 0.98);
                }

                .dark-mode .draggable-panel {
                    background: rgba(31, 41, 55, 0.98);
                    color: #f3f4f6;
                    border-color: #6366f1;
                }

                .draggable-panel.dragging {
                    opacity: 0.95;
                    box-shadow: 0 20px 45px rgba(0,0,0,0.35);
                    cursor: grabbing;
                }

                .panel-header {
                    background: var(--primary, #4f46e5);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 14px 14px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    cursor: grab;
                }

                .panel-header:active {
                    cursor: grabbing;
                }

                .header-controls {
                    margin-left: auto;
                    display: flex;
                    gap: 8px;
                }

                .panel-control {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.2s;
                }

                .panel-control:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.1);
                }

                .panel-content {
                    padding: 16px;
                    transition: all 0.3s;
                }

                .panel-content.minimized {
                    display: none;
                }

                .panel-section {
                    margin-bottom: 15px;
                }

                .speech-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid var(--border, #e5e7eb);
                    border-radius: 10px;
                    background: var(--input-bg, white);
                    color: var(--text, #1f2937);
                    font-size: 13px;
                    cursor: pointer;
                }

                .dark-mode .speech-select {
                    background: #374151;
                    color: #f3f4f6;
                    border-color: #4b5563;
                }

                .speech-controls {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }

                .speech-btn {
                    width: 45px;
                    height: 45px;
                    border: none;
                    border-radius: 50%;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    color: white;
                }

                .speech-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .play-btn {
                    background: #10b981;
                }
                .play-btn:hover:not(:disabled) {
                    background: #059669;
                    transform: scale(1.1);
                }

                .pause-btn {
                    background: #f59e0b;
                }
                .pause-btn:hover:not(:disabled) {
                    background: #d97706;
                    transform: scale(1.1);
                }

                .stop-btn {
                    background: #ef4444;
                }
                .stop-btn:hover:not(:disabled) {
                    background: #dc2626;
                    transform: scale(1.1);
                }

                .slider-container, .language-selector {
                    margin-bottom: 12px;
                }

                .slider-container label, .language-selector label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }

                #speech-rate {
                    flex: 1;
                    height: 4px;
                    border-radius: 2px;
                }

                #speech-language {
                    flex: 1;
                    padding: 6px;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: var(--input-bg);
                    color: var(--text);
                }

                .current-paragraph-text {
                    max-height: 80px;
                    overflow-y: auto;
                    padding: 10px;
                    background: var(--bg-secondary, #f9fafb);
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.5;
                    border-left: 3px solid var(--primary);
                }

                .dark-mode .current-paragraph-text {
                    background: #2d3748;
                }

                .status-bar {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: var(--text-light);
                    padding-top: 8px;
                    border-top: 1px solid var(--border);
                }

                #tts-panel-toggle.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                #tts-panel-toggle.active i {
                    color: white;
                }
            `;

            document.head.appendChild(style);
        }

        // ========== MAKE PANEL DRAGGABLE ==========
        function makeDraggable(element) {
            const handle = document.getElementById('drag-handle');
            if (!handle) return;

            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

            handle.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
                element.classList.add('dragging');
            }

            function elementDrag(e) {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                const newTop = element.offsetTop - pos2;
                const newLeft = element.offsetLeft - pos1;

                // Keep within viewport
                const maxTop = window.innerHeight - element.offsetHeight;
                const maxLeft = window.innerWidth - element.offsetWidth;

                element.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
                element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                element.classList.remove('dragging');
            }
        }

        // ========== INITIALIZE PANEL FUNCTIONALITY ==========
        function initializePanel() {
            const selector = document.getElementById('paragraph-selector');
            const playBtn = document.getElementById('play-paragraph');
            const pauseBtn = document.getElementById('pause-paragraph');
            const stopBtn = document.getElementById('stop-paragraph');
            const rateSlider = document.getElementById('speech-rate');
            const rateValue = document.getElementById('rate-value');
            const languageSelect = document.getElementById('speech-language');
            const closeBtn = document.getElementById('close-speech-panel');
            const minimizeBtn = document.getElementById('minimize-panel');
            const currentTextDiv = document.getElementById('current-paragraph-text');
            const wordCountSpan = document.getElementById('word-count');
            const panelContent = document.querySelector('.panel-content');

            if (!selector) return;

            // Load paragraphs
            updateParagraphSelector(selector, currentTextDiv, wordCountSpan);

            // Update rate display
            rateSlider.addEventListener('input', () => {
                rateValue.textContent = rateSlider.value + 'x';
            });

            // Enable/disable play button based on selection
            selector.addEventListener('change', () => {
                const selected = selector.value;
                playBtn.disabled = !selected;

                if (selected) {
                    const option = selector.options[selector.selectedIndex];
                    const fullText = option.dataset.fullText || option.textContent;
                    currentTextDiv.innerHTML = `<i class="fas fa-quote-right"></i> <span>${fullText.substring(0, 100)}${fullText.length > 100 ? '...' : ''}</span>`;

                    // Update word count
                    const words = fullText.split(/\s+/).length;
                    wordCountSpan.textContent = words + ' words';
                } else {
                    currentTextDiv.innerHTML = '<i class="fas fa-quote-right"></i> <span>No paragraph selected</span>';
                    wordCountSpan.textContent = '0 words';
                }
            });

            // Play button
            playBtn.addEventListener('click', () => {
                if (!selector.value) return;

                const selectedOption = selector.options[selector.selectedIndex];
                const text = selectedOption.dataset.fullText || selectedOption.textContent;
                const language = languageSelect.value;
                const rate = parseFloat(rateSlider.value);

                // Try Google TTS first
                playWithGoogleTTS(text, language, rate);
            });

            // Pause button
            pauseBtn.addEventListener('click', () => {
                if (currentAudio) {
                    if (isPlaying) {
                        currentAudio.pause();
                        isPlaying = false;
                        isPaused = true;
                    } else if (isPaused) {
                        currentAudio.play();
                        isPlaying = true;
                        isPaused = false;
                    }
                } else if ('speechSynthesis' in window) {
                    if (isPaused) {
                        window.speechSynthesis.resume();
                        isPaused = false;
                        isPlaying = true;
                    } else {
                        window.speechSynthesis.pause();
                        isPaused = true;
                        isPlaying = false;
                    }
                }

                updatePlayPauseButtons();
            });

            // Stop button
            stopBtn.addEventListener('click', () => {
                stopCurrentAudio();
            });

            // Close button
            closeBtn.addEventListener('click', () => {
                toggleTTSPanel();
            });

            // Minimize button
            minimizeBtn.addEventListener('click', () => {
                if (panelContent) {
                    panelContent.classList.toggle('minimized');
                    minimizeBtn.textContent = panelContent.classList.contains('minimized') ? '+' : '−';
                }
            });
        }

        // ========== UPDATE PARAGRAPH SELECTOR ==========
        function updateParagraphSelector(selector, currentTextDiv, wordCountSpan) {
            const paragraphs = document.querySelectorAll('.paragraph');

            // Clear existing options except first
            while (selector.options.length > 1) {
                selector.remove(1);
            }

            // Add paragraphs
            paragraphs.forEach((p, index) => {
                const text = p.textContent.trim();
                const preview = text.substring(0, 50) + '...';
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Paragraph ${index + 1}: ${preview}`;
                option.dataset.fullText = text;
                selector.appendChild(option);
            });

            console.log(`📚 Loaded ${paragraphs.length} paragraphs`);
        }

        // ========== SHOW NOTIFICATION ==========
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                z-index: 10001;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        // ========== START THE SCRIPT ==========
        // Add button to reading controls
        addTTSButtonToControls();

        // Also add button when story changes
        const originalDisplayStory = window.displayStory;
        if (originalDisplayStory) {
            window.displayStory = function(story) {
                originalDisplayStory(story);
                // Re-add button after story loads
                setTimeout(() => {
                    addTTSButtonToControls();

                    // Update panel if open
                    if (isPanelOpen) {
                        const selector = document.getElementById('paragraph-selector');
                        const currentTextDiv = document.getElementById('current-paragraph-text');
                        const wordCountSpan = document.getElementById('word-count');
                        if (selector) {
                            updateParagraphSelector(selector, currentTextDiv, wordCountSpan);
                        }
                    }
                }, 1000);
            };
        }

        console.log('✅ Paragraph TTS Selector loaded! Click the "Listen" button in reading controls');

    }, 1500);
})();
