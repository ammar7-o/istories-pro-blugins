// ============= DRAGGABLE TEXT SELECTION TRANSLATION =============
// Copy and paste this entire code into the Custom JavaScript Editor

(function() {
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'selectionTranslator';
    popup.innerHTML = `
        <div class="selection-translator" id="translatorContainer">
            <div class="translator-header" id="translatorHeader">
                <div class="header-left">
                    <i class="fas fa-language"></i>
                    <span>Translate Selection</span>
                </div>
                <div class="header-right">
                    <span class="drag-handle" title="Drag to move"><i class="fas fa-grip-lines"></i></span>
                    <button class="close-translator"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="translator-content">
                <div class="selected-text-container">
                    <div class="selected-text-label">Selected:</div>
                    <div class="selected-text-display" id="selectedTextDisplay"></div>
                </div>
                <div class="translator-controls">
                    <select id="transLang" class="lang-select">
                        <option value="ar">Arabic (العربية)</option>
                        <option value="fr">French (Français)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="de">German (Deutsch)</option>
                        <option value="ru">Russian (Русский)</option>
                        <option value="zh-CN">Chinese (中文)</option>
                        <option value="ja">Japanese (日本語)</option>
                        <option value="ko">Korean (한국어)</option>
                        <option value="tr">Turkish (Türkçe)</option>
                        <option value="fa">Persian (فارسی)</option>
                        <option value="ur">Urdu (اردو)</option>
                        <option value="en">English</option>
                    </select>
                    <button class="translate-btn" id="translateBtn">
                        <i class="fas fa-sync-alt"></i> Translate
                    </button>
                </div>
                <div class="translation-result-container">
                    <div class="translation-result" id="translationResult">
                        <span class="placeholder">Translation will appear here...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #selectionTranslator {
            position: absolute;
            z-index: 999999;
            display: none;
            user-select: none;
        }
        
        .selection-translator {
            position: relative;
            background: var(--bg, #ffffff);
            border: 1px solid var(--border, #e5e7eb);
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            width: 320px;
            animation: fadeScale 0.2s ease;
            overflow: hidden;
        }
        
        .dark-mode .selection-translator {
            background: #1f2937;
            border-color: #374151;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        
        .translator-header {
            padding: 12px 15px;
            background: var(--primary, #4a6cf7);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        
        .header-left i {
            font-size: 1rem;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .drag-handle {
            cursor: move;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(255,255,255,0.2);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            transition: background 0.2s;
        }
        
        .drag-handle:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .close-translator {
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
            font-size: 1rem;
            transition: all 0.2s;
        }
        
        .close-translator:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.05);
        }
        
        .translator-content {
            padding: 15px;
        }
        
        .selected-text-container {
            margin-bottom: 15px;
        }
        
        .selected-text-label {
            font-size: 0.8rem;
            color: var(--text-light, #6b7280);
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .selected-text-display {
            background: var(--bg-secondary, #f9fafb);
            padding: 10px;
            border-radius: 8px;
            font-size: 0.95rem;
            max-height: 80px;
            overflow-y: auto;
            border-left: 3px solid var(--primary, #4a6cf7);
            color: var(--text, #1f2937);
            line-height: 1.4;
            word-break: break-word;
        }
        
        .dark-mode .selected-text-display {
            background: #374151;
            color: #f3f4f6;
        }
        
        .translator-controls {
            margin-bottom: 15px;
        }
        
        .lang-select {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 2px solid var(--border, #e5e7eb);
            border-radius: 8px;
            background: var(--bg, white);
            color: var(--text, #1f2937);
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .dark-mode .lang-select {
            background: #374151;
            border-color: #4b5563;
            color: #f3f4f6;
        }
        
        .lang-select:hover {
            border-color: var(--primary, #4a6cf7);
        }
        
        .lang-select:focus {
            outline: none;
            border-color: var(--primary, #4a6cf7);
            box-shadow: 0 0 0 3px rgba(74,108,247,0.1);
        }
        
        .translate-btn {
            width: 100%;
            padding: 12px;
            background: var(--primary, #4a6cf7);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }
        
        .translate-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(74,108,247,0.3);
        }
        
        .translate-btn:active {
            transform: translateY(0);
        }
        
        .translate-btn i {
            font-size: 0.9rem;
        }
        
        .translation-result-container {
            background: var(--bg-secondary, #f9fafb);
            border-radius: 8px;
            padding: 12px;
            min-height: 60px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .dark-mode .translation-result-container {
            background: #374151;
        }
        
        .translation-result {
            font-size: 1rem;
            line-height: 1.5;
            color: var(--text, #1f2937);
            word-break: break-word;
        }
        
        .dark-mode .translation-result {
            color: #f3f4f6;
        }
        
        .translation-result .placeholder {
            color: var(--text-light, #9ca3af);
            font-style: italic;
            font-size: 0.9rem;
        }
        
        /* RTL Support */
        .translation-result[dir="rtl"] {
            text-align: right;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        /* Scrollbar styling */
        .selected-text-display::-webkit-scrollbar,
        .translation-result-container::-webkit-scrollbar {
            width: 4px;
        }
        
        .selected-text-display::-webkit-scrollbar-thumb,
        .translation-result-container::-webkit-scrollbar-thumb {
            background: var(--border, #e5e7eb);
            border-radius: 4px;
        }
        
        .dark-mode .selected-text-display::-webkit-scrollbar-thumb,
        .dark-mode .translation-result-container::-webkit-scrollbar-thumb {
            background: #4b5563;
        }
        
        @keyframes fadeScale {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        /* Loading spinner */
        .fa-spinner.fa-spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Variables
    let selectedText = '';
    let isDragging = false;
    let offsetX, offsetY;
    let currentTranslateBtn = null;

    // Make the popup draggable
    const translatorContainer = document.getElementById('translatorContainer');
    const translatorHeader = document.getElementById('translatorHeader');

    function startDrag(e) {
        if (e.target.closest('.close-translator')) return;
        
        isDragging = true;
        const rect = translatorContainer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        translatorContainer.style.transition = 'none';
        translatorContainer.style.cursor = 'grabbing';
        
        e.preventDefault();
    }

    function onDrag(e) {
        if (!isDragging) return;
        
        const popup = document.getElementById('selectionTranslator');
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep within viewport
        const maxX = window.innerWidth - translatorContainer.offsetWidth;
        const maxY = window.innerHeight - translatorContainer.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        popup.style.left = boundedX + 'px';
        popup.style.top = boundedY + 'px';
        popup.style.transform = 'none';
    }

    function stopDrag() {
        if (isDragging) {
            isDragging = false;
            translatorContainer.style.transition = '';
            translatorContainer.style.cursor = '';
        }
    }

    translatorHeader.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);

    // Handle text selection
    document.addEventListener('mouseup', function(e) {
        // Don't show if clicking inside popup
        if (e.target.closest('#selectionTranslator')) return;
        
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            
            if (text && text.length > 0 && text.length < 1000) {
                // Store selection
                selectedText = text;
                
                // Get position
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Show popup
                const popup = document.getElementById('selectionTranslator');
                const selectedDisplay = document.getElementById('selectedTextDisplay');
                selectedDisplay.textContent = text.length > 200 ? text.substring(0, 200) + '...' : text;
                
                // Clear previous result
                const resultDiv = document.getElementById('translationResult');
                resultDiv.innerHTML = '<span class="placeholder">Translation will appear here...</span>';
                
                // Position popup initially near selection
                let left = rect.left + window.scrollX;
                let top = rect.bottom + window.scrollY + 10;
                
                // Adjust if popup would go off screen
                const popupWidth = 320;
                const popupHeight = 350;
                
                if (left + popupWidth > window.innerWidth) {
                    left = window.innerWidth - popupWidth - 10;
                }
                if (left < 10) left = 10;
                
                if (top + popupHeight > window.innerHeight) {
                    top = rect.top + window.scrollY - popupHeight - 10;
                }
                if (top < 10) top = 10;
                
                popup.style.left = left + 'px';
                popup.style.top = top + 'px';
                popup.style.transform = 'none';
                popup.style.display = 'block';
                
                // Load saved language preference
                const savedLang = localStorage.getItem('selectionTransLang') || 'ar';
                document.getElementById('transLang').value = savedLang;
                
                // Auto-translate if enabled
                if (localStorage.getItem('autoTranslateSelection') === 'true') {
                    setTimeout(translateSelectedText, 200);
                }
            }
        }, 10);
    });

    // Close popup function
    function closePopup() {
        document.getElementById('selectionTranslator').style.display = 'none';
    }

    // Translate function
    async function translateSelectedText() {
        const text = selectedText;
        if (!text) return;
        
        const targetLang = document.getElementById('transLang').value;
        localStorage.setItem('selectionTransLang', targetLang);
        
        const resultDiv = document.getElementById('translationResult');
        resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
        
        try {
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
            );
            
            if (!response.ok) throw new Error('Translation failed');
            
            const data = await response.json();
            let translation = '';
            
            if (data && data[0]) {
                translation = data[0].map(item => item[0]).join('');
            }
            
            resultDiv.innerHTML = translation || 'No translation available';
            
            // RTL support
            const rtlLanguages = ['ar', 'fa', 'ur', 'he'];
            if (rtlLanguages.includes(targetLang)) {
                resultDiv.setAttribute('dir', 'rtl');
            } else {
                resultDiv.setAttribute('dir', 'ltr');
            }
            
        } catch (error) {
            resultDiv.innerHTML = '<span style="color: #ef4444;">Translation failed. Try again.</span>';
            console.error('Translation error:', error);
        }
    }

    // Add event listeners
    document.querySelector('.close-translator').addEventListener('click', closePopup);
    document.getElementById('translateBtn').addEventListener('click', translateSelectedText);
    
    // Allow pressing Enter in select to translate
    document.getElementById('transLang').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            translateSelectedText();
        }
    });

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    });

    // Close when clicking outside
    document.addEventListener('mousedown', function(e) {
        const popup = document.getElementById('selectionTranslator');
        if (popup.style.display === 'block' && !popup.contains(e.target)) {
            closePopup();
        }
    });

    // Add toggle to settings (optional)
    setTimeout(() => {
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent && !document.getElementById('autoTranslateSelection')) {
            const toggleHTML = `
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-label">Auto-translate Selection</span>
                        <span class="setting-desc">Automatically translate selected text</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoTranslateSelection">
                        <span class="slider"></span>
                    </label>
                </div>
            `;
            
            const paragraphToggle = document.querySelector('[for="paragraphTranslationToggle"]')?.closest('.setting-item');
            if (paragraphToggle) {
                paragraphToggle.insertAdjacentHTML('afterend', toggleHTML);
                
                // Load saved preference
                const saved = localStorage.getItem('autoTranslateSelection') === 'true';
                document.getElementById('autoTranslateSelection').checked = saved;
                
                // Save preference
                document.getElementById('autoTranslateSelection').addEventListener('change', function(e) {
                    localStorage.setItem('autoTranslateSelection', e.target.checked);
                });
            }
        }
    }, 1000);

    console.log('✅ Draggable text selection translator loaded');
})();
