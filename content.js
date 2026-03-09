// content.js
// Bootstraps the UI and events when matched on the KB editor page

const copilotHTML = `
  <div id="kb-copilot-panel">
    <div class="kbc-header" id="kbc-drag-handle">
      <img id="kbc-logo" src="" alt="KB Copilot" />
      <span>KB Copilot</span>
    </div>
    
    <div class="kbc-buttons">
      <button id="btn-insert-template" class="kbc-btn">Insert Forterro Template</button>
      <button id="btn-add-changelog" class="kbc-btn">Add Change Log Entry</button>
      <button id="btn-fix-all" class="kbc-btn">Fix All (Safe)</button>
    </div>
    
    <div id="kbc-toast" class="kbc-toast"></div>

    <div class="kbc-settings-section">
      <button id="btn-toggle-settings" class="kbc-toggle-btn">⚙️ Settings ▼</button>
      <div id="kbc-settings-content" class="kbc-settings-content" style="display: none;">
        <div class="kbc-setting-field">
          <label>Author name</label>
          <input type="text" id="kbc-setting-authorName" placeholder="Your name">
        </div>
        <div class="kbc-setting-field">
          <label>Reviewer name</label>
          <input type="text" id="kbc-setting-reviewerName" placeholder="Reviewer">
        </div>
        <div class="kbc-setting-field">
          <label>Business Unit</label>
          <input type="text" id="kbc-setting-businessUnit">
        </div>
        <div class="kbc-setting-field">
          <label>Product</label>
          <input type="text" id="kbc-setting-product">
        </div>
        <div class="kbc-setting-field">
          <label>Product version</label>
          <input type="text" id="kbc-setting-productVersion">
        </div>
        <div class="kbc-setting-field">
          <label>Default KB Version</label>
          <input type="text" id="kbc-setting-defaultKbVersion" value="1.0">
        </div>
        <button id="kbc-save-settings">Save Settings</button>
        <div id="kbc-settings-status"></div>
      </div>
    </div>
  </div>
`;

const EditorSanitizer = {
    sanitizeInsertedHTML: function (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        Array.from(doc.body.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                this.sanitizeParagraphNode(node);
            }
        });

        return doc.body.innerHTML;
    },

    sanitizeParagraphNode: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toLowerCase();
        if (tag === 'table' || tag === 'img' || tag === 'hr') return;

        // Remove leading empty/whitespace-only inline nodes or text nodes
        while (node.firstChild) {
            let child = node.firstChild;
            if (child.nodeType === Node.TEXT_NODE) {
                let text = child.textContent.replace(/^[ \t\n\r\u00A0]+/, '');
                if (text === '') {
                    node.removeChild(child);
                } else {
                    child.textContent = text;
                    break;
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName.toLowerCase() !== 'img' && child.tagName.toLowerCase() !== 'br' && child.innerHTML.replace(/(?:&nbsp;|\s|[\u00A0\u200B-\u200D\uFEFF])+/gi, '') === '') {
                    node.removeChild(child);
                } else {
                    this.sanitizeParagraphNode(child);
                    break;
                }
            } else {
                break;
            }
        }

        if (node.innerHTML) {
            let oldHtml = node.innerHTML;
            let html = oldHtml;

            // Strip leading spaces from the paragraph block
            html = html.replace(/^(?:&nbsp;|\s|[\u00A0\u200B-\u200D\uFEFF])+/gi, '');

            // Strip hidden template tab spaces immediately following any soft linebreaks
            html = html.replace(/(<br[^>]*>)(?:&nbsp;|\s|[\u00A0\u200B-\u200D\uFEFF])+/gi, '$1');

            // ONLY reassign and trigger a DOM reflow if a hidden space artifact was actually caught.
            // This prevents the user's live cursor from collapsing to the origin of the node while typing.
            if (html !== oldHtml) {
                node.innerHTML = html;
            }
        }

        this.sanitizeParagraphVisualIndent(node);

        if (tag === 'p') {
            const hasMedia = node.querySelector('img, table, iframe, hr');
            if (!hasMedia && node.innerHTML.replace(/(?:&nbsp;|\s|[\u00A0\u200B-\u200D\uFEFF]|<br>)+/gi, '') === '') {
                if (node.innerHTML !== '<br>') node.innerHTML = '<br>';
            }
        }
    },

    isNormalBodyParagraph: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
        const tag = node.tagName.toLowerCase();
        if (tag !== 'p' && tag !== 'div') return false;
        if (node.querySelector('table, img, hr')) return false;

        const text = (node.textContent || node.innerText || '').trim().toLowerCase();
        if (text === 'prerequisites' || text === 'resources' || text === 'article text title' || text.startsWith('subarea title')) return false;

        let parent = node.parentElement;
        while (parent && parent.tagName) {
            let pTag = parent.tagName.toLowerCase();
            if (pTag === 'li' || pTag === 'ul' || pTag === 'ol') return false;
            if (parent.hasAttribute && parent.hasAttribute('contenteditable')) break;
            parent = parent.parentElement;
        }

        return true;
    },

    sanitizeParagraphVisualIndent: function (node) {
        if (!this.isNormalBodyParagraph(node)) return;

        node.style.marginLeft = '0px';
        node.style.paddingLeft = '0px';
        node.style.textIndent = '0px';

        this.removeIndentArtifacts(node);
    },

    removeIndentArtifacts: function (node) {
        if (node.classList) {
            const classes = Array.from(node.classList);
            classes.forEach(c => {
                if (c.toLowerCase().includes('indent') || c.toLowerCase().includes('margin') || c.toLowerCase().includes('pad')) {
                    node.classList.remove(c);
                }
            });
            if (node.classList.length === 0) {
                node.removeAttribute('class');
            }
        }

        const parent = node.parentElement;
        if (parent && parent.tagName && parent.tagName.toLowerCase() === 'blockquote') {
            // Unwrap from blockquote if mistakenly wrapped 
            parent.parentNode.insertBefore(node, parent);
            if (!parent.textContent.trim() && !parent.querySelector('img')) {
                parent.parentNode.removeChild(parent);
            }
        }
    },

    getClosestParagraph: function (node) {
        if (!node) return null;
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'p') return node;
        let parent = node.parentElement;
        while (parent && parent.tagName) {
            if (parent.tagName.toLowerCase() === 'p') return parent;
            if (parent.hasAttribute && parent.hasAttribute('contenteditable')) break;
            parent = parent.parentElement;
        }
        return null;
    },

    sanitizeNearbyParagraphs: function (node) {
        let p = this.getClosestParagraph(node);
        if (!p) return;

        let prev = p.previousElementSibling;
        let next = p.nextElementSibling;

        this.sanitizeParagraphNode(p);
        if (prev && prev.tagName.toLowerCase() === 'p') this.sanitizeParagraphNode(prev);
        if (next && next.tagName.toLowerCase() === 'p') this.sanitizeParagraphNode(next);
    },

    attachLiveListeners: function () {
        const editor = Template.findEditorRoot();
        if (!editor) return;

        const handleAction = () => {
            setTimeout(() => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    EditorSanitizer.sanitizeNearbyParagraphs(selection.anchorNode);
                }
            }, 0);
        };

        const handleKeyup = (e) => {
            if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                handleAction();
            }
        };

        const handleInput = (e) => {
            if (e.inputType === 'insertParagraph' || e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                handleAction();
            }
        };

        if (!editor.dataset.sanitizerAttached) {
            editor.addEventListener('keyup', handleKeyup);
            editor.addEventListener('input', handleInput);
            editor.dataset.sanitizerAttached = 'true';
        }
    }
};

function initCopilot() {
    if (document.getElementById('kb-copilot-panel')) return; // Already initialized

    // Inject HTML structure into Document Body
    const wrapper = document.createElement('div');
    wrapper.innerHTML = copilotHTML;
    document.body.appendChild(wrapper.firstElementChild);

    // Set logo using chrome runtime URL
    const logoEl = document.getElementById('kbc-logo');
    if (logoEl && typeof chrome !== 'undefined' && chrome.runtime) {
        logoEl.src = chrome.runtime.getURL('logo.png');
    }

    bindEvents();
    makePanelDraggable();

    // Initialize settings
    if (typeof Settings !== 'undefined') {
        Settings.init();
    }

    Template.observeEditor(
        () => { }, // no status display
        () => {
            // On Ready
            EditorSanitizer.attachLiveListeners();
        },
        () => {
            // On Timeout - silent, just show brief toast
            showToast('Editor not found. Please wait and try again.', 'error');
        }
    );
}

function makePanelDraggable() {
    const panel = document.getElementById('kb-copilot-panel');
    const handle = document.getElementById('kbc-drag-handle');
    if (!panel || !handle) return;

    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        panel.style.transition = 'none';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, startLeft + dx));
        const newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, startTop + dy));
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.transition = '';
            document.body.style.userSelect = '';
        }
    });
}


function showFeedback(msg, type) {
    showToast(msg, type);
}

function showToast(msg, type) {
    const toast = document.getElementById('kbc-toast');
    if (!toast) return;

    // Reset classes
    toast.className = 'kbc-toast';
    toast.classList.add(type === 'error' ? 'kbc-toast-error' : 'kbc-toast-success');
    toast.textContent = msg;
    toast.classList.add('kbc-toast-show');

    // Auto-hide after 3 seconds
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('kbc-toast-show');
    }, 3000);
}

function bindEvents() {
    // Button Event Listeners
    document.getElementById('btn-insert-template').addEventListener('click', async () => {
        try {
            const editor = Template.findEditorRoot();
            if (!editor) {
                throw new Error("Could not find the text editor. Wait for it to load.");
            }

            let currentHtml = Template.getEditorContent().trim();
            let hasContent = currentHtml.length > 0 && currentHtml !== '<p><br></p>' && currentHtml !== '<br>';

            if (hasContent) {
                const confirmReplace = confirm("The editor already contains content. Are you sure you want to replace it with the template?");
                if (!confirmReplace) {
                    return; // User cancelled
                }
            }

            let finalHtml = await Template.loadKBTemplate();

            // Load configs from Settings or default
            const config = (typeof Settings !== 'undefined') ? Settings.config : {};

            // Use DOMParser to safely inject the variables into the template structure
            const parser = new DOMParser();
            const doc = parser.parseFromString(finalHtml, 'text/html');
            const tables = doc.querySelectorAll('table');

            if (tables.length > 0) {
                const table = tables[tables.length - 1]; // Assume last table is Change Log
                const rows = table.querySelectorAll('tr');

                // Find the first data row (usually row 1, index 1)
                if (rows.length > 1) {
                    const firstDataRow = rows[1];
                    const cells = firstDataRow.querySelectorAll('td');

                    // Expected Order: KB Version(0), Date Updated(1), Business Unit(2), Product(3), Product version(4), Author(5), Reviewer(6), Change(7)
                    if (cells.length >= 8) {
                        cells[0].innerHTML = config.defaultKbVersion || "1.0";
                        cells[1].innerHTML = new Date().toISOString().split('T')[0];
                        cells[2].innerHTML = config.businessUnit || "<br>";
                        cells[3].innerHTML = config.product || "<br>";
                        cells[4].innerHTML = config.productVersion || "<br>";
                        cells[5].innerHTML = config.authorName || "<br>";
                        cells[6].innerHTML = config.reviewerName || "<br>";
                        cells[7].innerHTML = "Document Creation";
                    }
                }
            }

            finalHtml = doc.body.innerHTML;
            finalHtml = EditorSanitizer.sanitizeInsertedHTML(finalHtml);
            Template.setEditorContent(finalHtml);

            // Set title Example
            const titleInput = Template.findTitleInput();
            if (titleInput) {
                titleInput.value = "Template for KB articles";
                titleInput.dispatchEvent(new Event('input', { bubbles: true }));
                titleInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            showFeedback('Template inserted successfully!', 'success');
            setTimeout(() => Validator.checkTemplate(), 500); // Check shortly after insert
        } catch (err) {
            showFeedback(err.message || 'Failed to insert template', 'error');
        }
    });

    document.getElementById('btn-add-changelog').addEventListener('click', () => {
        try {
            const success = Template.addChangeLogEntry();
            if (success) {
                showFeedback('Change log entry added successfully!', 'success');
            }
        } catch (err) {
            showFeedback(err.message || 'Failed to add change log entry', 'error');
        }
    });

    document.getElementById('btn-fix-all').addEventListener('click', () => {
        try {
            const success = Formatter.fixAll();
            if (success) {
                showFeedback('Formatting fixed!', 'success');
            }
        } catch (err) {
            showFeedback(err.message || 'Failed to format content safely', 'error');
        }
    });

    // Settings Collapsible event
    const settingsBtn = document.getElementById('btn-toggle-settings');
    const settingsContent = document.getElementById('kbc-settings-content');

    settingsBtn.addEventListener('click', () => {
        if (settingsContent.style.display === 'none') {
            settingsContent.style.display = 'block';
            settingsBtn.textContent = '⚙️ Settings ▲';
        } else {
            settingsContent.style.display = 'none';
            settingsBtn.textContent = '⚙️ Settings ▼';
        }
    });

    // Save Settings Event
    const saveBtn = document.getElementById('kbc-save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (typeof Settings !== 'undefined') {
                Settings.saveFromUI();
                const statusEl = document.getElementById('kbc-settings-status');
                statusEl.textContent = 'Saved!';
                setTimeout(() => { statusEl.textContent = ''; }, 2000);
            }
        });
    }

    setInterval(() => {
        if (typeof Settings !== 'undefined' && Settings.config.autoCheck) {
            // auto-check silently
        }
    }, 5000);
}

// Only run on new article page
if (window.location.href.includes('/articles/new')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopilot);
    } else {
        setTimeout(initCopilot, 1000);
    }
}
