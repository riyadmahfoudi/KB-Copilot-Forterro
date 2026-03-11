// formatter.js
// Safe deterministic formatter for KB article structure

const Formatter = {
    fixAll: function () {
        const editor = Template.findEditorRoot();
        if (!editor) {
            throw new Error("Editor not found. Wait for it to load.");
        }

        const blocks = this.collectBlocks(editor);
        if (!blocks.length) {
            throw new Error("No content found to format.");
        }

        const html = this.rebuildFromBlocks(blocks);
        Template.setEditorContent(html);
        return true;
    },

    collectBlocks: function (editorRoot) {
        const blocks = [];
        const children = Array.from(editorRoot.childNodes);

        for (const node of children) {
            if (node.nodeType === Node.TEXT_NODE) {
                const cleaned = (node.textContent || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
                if (!cleaned) continue;

                const p = document.createElement("p");
                p.textContent = (node.textContent || "").replace(/^[\s\u00A0\u200B-\u200D\uFEFF]+|[\s\u00A0\u200B-\u200D\uFEFF]+$/g, "");
                const type = this.classifyNode(p);
                if (type === "empty spacer") continue;

                const clone = this.sanitizeNodeClone(p, type);
                blocks.push({
                    type,
                    html: clone.outerHTML,
                    text: this.getNormalizedText(clone)
                });
                continue;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const initialType = this.classifyNode(node);
            if (initialType === "empty spacer") continue;

            // Ignore existing hr blocks completely; we recreate the title divider ourselves
            if (initialType === "hr block") continue;

            const clone = this.sanitizeNodeClone(node, initialType);
            const finalType = this.classifyNode(clone);

            if (finalType === "empty spacer") continue;
            if (finalType === "hr block") continue;

            blocks.push({
                type: finalType,
                html: clone.outerHTML,
                text: this.getNormalizedText(clone)
            });
        }

        return blocks;
    },

    classifyNode: function (node) {
        if (!node) return "unknown";

        if (node.nodeType === Node.TEXT_NODE) {
            const text = (node.textContent || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
            return text ? "paragraph/text" : "empty spacer";
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return "unknown";

        if (this.isEmptyParagraph(node)) return "empty spacer";
        if (this.isTableBlock(node)) return "table block";
        if (this.isImageBlock(node)) return "image block";

        const tag = node.tagName.toLowerCase();
        if (tag === "hr") return "hr block";

        const text = this.getNormalizedText(node);

        if (text === "prerequisites") return "prerequisites heading";
        if (text === "resources") return "resources heading";
        if (this.isArticleTextTitle(node, text)) return "article title";
        if (this.isSubareaTitle(node, text)) return "subarea title";

        return "paragraph/text";
    },

    getNormalizedText: function (node) {
        return (node.textContent || node.innerText || "")
            .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    },

    isArticleTextTitle: function (node, text) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

        const normalized = text || this.getNormalizedText(node);
        const fontSize = (node.style && node.style.fontSize) ? node.style.fontSize : "";
        const tag = node.tagName.toLowerCase();

        if (normalized === "article text title") return true;
        if (fontSize === "24px") return true;
        if (/^h[1-6]$/.test(tag) && normalized.includes("article text title")) return true;

        return false;
    },

    isSubareaTitle: function (node, text) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

        const normalized = text || this.getNormalizedText(node);
        const fontSize = (node.style && node.style.fontSize) ? node.style.fontSize : "";
        const tag = node.tagName.toLowerCase();

        if (normalized.startsWith("subarea title")) return true;
        if (fontSize === "18px") return true;
        if (/^h[1-6]$/.test(tag) && normalized.includes("subarea title")) return true;

        return false;
    },

    isEmptyParagraph: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

        if (node.tagName && node.tagName.toLowerCase() === "br") return true;

        const hasMedia = !!node.querySelector("img, table, iframe, hr");
        if (hasMedia) return false;

        const text = (node.textContent || node.innerText || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
        return text === "";
    },

    isTableBlock: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

        const table = node.tagName.toLowerCase() === "table" ? node : node.querySelector("table");
        if (!table) return false;

        const text = this.getNormalizedText(table);
        return (
            text.includes("kb version") &&
            text.includes("date updated") &&
            text.includes("author")
        );
    },

    isImageBlock: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

        if (node.tagName.toLowerCase() === "img") return true;

        const images = node.querySelectorAll ? node.querySelectorAll("img") : [];
        if (!images.length) return false;

        const text = (node.textContent || node.innerText || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
        return text === "";
    },

    sanitizeNodeClone: function (node, type) {
        const clone = node.cloneNode(true);

        this.removeWhitespaceTextNodes(clone);
        this.removeIndentArtifactsDeep(clone);
        this.trimLeadingWhitespaceDeep(clone);
        this.trimTrailingWhitespaceDeep(clone);

        if (type === "article title") {
            this.applyArticleTitleStyle(clone);
        } else if (type === "subarea title") {
            this.applySubareaTitleStyle(clone);
        } else if (type === "paragraph/text" || type === "prerequisites heading" || type === "resources heading") {
            this.normalizeParagraphLikeNode(clone);
            if (type === "prerequisites heading" || type === "resources heading") {
                const brs = clone.querySelectorAll("br");
                brs.forEach((br) => br.remove());
                clone.style.setProperty("margin", "0px", "important");
                clone.style.setProperty("padding", "0px", "important");
            }
        }

        if (this.isEmptyParagraph(clone)) {
            const p = document.createElement("p");
            p.innerHTML = "<br>";
            return p;
        }

        return clone;
    },

    removeWhitespaceTextNodes: function (root) {
        if (!root) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const textNodes = [];

        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach((textNode) => {
            if (!textNode.parentNode) return;

            // Normalize non-breaking spaces and other artifacts to regular spaces
            // but DO NOT trim the edges of text nodes to preserve sentence flow
            // between text and inline elements like <strong> or <a>.
            textNode.textContent = (textNode.textContent || "")
                .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, " ");
        });
    },

    removeIndentArtifactsDeep: function (root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return;

        const elements = [root, ...root.querySelectorAll("*")];

        elements.forEach((el) => {
            const tag = el.tagName.toLowerCase();

            if (tag === "table" || tag === "tr" || tag === "td" || tag === "th" || tag === "img") {
                return;
            }

            el.style.marginLeft = "";
            el.style.paddingLeft = "";
            el.style.textIndent = "";

            if (el.hasAttribute("style")) {
                let style = el.getAttribute("style") || "";
                style = style
                    .replace(/(?:^|;)\s*margin-left\s*:[^;]+/gi, "")
                    .replace(/(?:^|;)\s*padding-left\s*:[^;]+/gi, "")
                    .replace(/(?:^|;)\s*text-indent\s*:[^;]+/gi, "")
                    .replace(/^;+|;+$/g, "")
                    .trim();

                if (style) {
                    el.setAttribute("style", style);
                } else {
                    el.removeAttribute("style");
                }
            }

            if (el.className && typeof el.className === "string") {
                el.className = el.className
                    .split(/\s+/)
                    .filter((c) => c && !/indent|fr-indented|ql-indent|margin|pad/i.test(c))
                    .join(" ");
                if (!el.className) {
                    el.removeAttribute("class");
                }
            }

            // unwrap accidental blockquotes around normal content
            if (tag === "blockquote" && !el.querySelector("img, table")) {
                const parent = el.parentNode;
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
            }
        });
    },

    trimLeadingWhitespaceDeep: function (node) {
        if (!node || !node.firstChild) return;

        while (node.firstChild) {
            const child = node.firstChild;

            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent = (child.textContent || "").replace(/^(?:[\u00A0\u200B-\u200D\uFEFF]|\s)+/, "");
                if (!child.textContent) {
                    node.removeChild(child);
                    continue;
                }
                break;
            }

            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                if (tag === "br") {
                    node.removeChild(child);
                    continue;
                }
                if (tag === "img" || tag === "table" || tag === "hr") break;

                this.trimLeadingWhitespaceDeep(child);

                const cleaned = (child.textContent || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
                if (!cleaned && !child.querySelector("img, table, hr, br")) {
                    node.removeChild(child);
                    continue;
                }
                break;
            }

            break;
        }
    },

    trimTrailingWhitespaceDeep: function (node) {
        if (!node || !node.lastChild) return;

        while (node.lastChild) {
            const child = node.lastChild;

            if (child.nodeType === Node.TEXT_NODE) {
                child.textContent = (child.textContent || "").replace(/(?:[\u00A0\u200B-\u200D\uFEFF]|\s)+$/, "");
                if (!child.textContent) {
                    node.removeChild(child);
                    continue;
                }
                break;
            }

            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                if (tag === "br") {
                    node.removeChild(child);
                    continue;
                }
                if (tag === "img" || tag === "table" || tag === "hr") break;

                this.trimTrailingWhitespaceDeep(child);

                const cleaned = (child.textContent || "").replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "");
                if (!cleaned && !child.querySelector("img, table, hr, br")) {
                    node.removeChild(child);
                    continue;
                }
                break;
            }

            break;
        }
    },

    normalizeParagraphLikeNode: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();
        if (!["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) return;
        if (node.querySelector("img, table, hr")) return;

        // The recursive trimLeadingWhitespaceDeep/trimTrailingWhitespaceDeep already handles the block boundaries.
        // Here we just collapse common HTML artifacts like actual newlines from source code.
        let html = node.innerHTML || "";
        html = html
            .replace(/(\r\n|\n|\r)/gm, " ") // Normalize hard newlines to spaces
            .replace(/\s{2,}/g, " ");         // Collapse multiple spaces

        node.innerHTML = html.trim() || "<br>";
        node.style.setProperty("margin", "0px", "important");
        node.style.setProperty("padding", "0px", "important");
    },

    applyArticleTitleStyle: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        node.style.fontSize = "24px";
        node.style.fontFamily = "Arial, sans-serif";
        node.style.fontWeight = "400";
        node.style.setProperty("margin", "0px", "important");
        node.style.setProperty("padding", "0px", "important");
    },

    applySubareaTitleStyle: function (node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        node.style.fontSize = "18px";
        node.style.fontFamily = "Arial, sans-serif";
        node.style.fontWeight = "400";
        node.style.setProperty("margin", "0px", "important");
        node.style.setProperty("padding", "0px", "important");
    },

    createEmptyParagraph: function () {
        return '<p style="margin: 0px !important; padding: 0px !important;"><br></p>';
    },

    createSpacerParagraphs: function (count) {
        let html = "";
        for (let i = 0; i < count; i++) {
            html += this.createEmptyParagraph();
        }
        return html;
    },

    createArticleDivider: function () {
        return '<hr style="display: block; height: 1px; border-width: 1px 0px; border-top-style: solid; border-top-color: #C9D3DB; border-bottom-style: solid; border-bottom-color: #FFFFFF; border-right-style: initial; border-left-style: initial; border-right-color: initial; border-left-color: initial; border-image: initial; margin: 20px 0px; padding: 0px; clear: both; user-select: none; box-sizing: border-box; -webkit-font-smoothing: antialiased;">';
    },

    rebuildFromBlocks: function (blocks) {
        const realBlocks = blocks.filter((b) => b.type !== "empty spacer" && b.type !== "hr block");
        let finalHtml = "";

        for (let i = 0; i < realBlocks.length; i++) {
            const current = realBlocks[i];
            const prev = i > 0 ? realBlocks[i - 1] : null;

            const spacesBefore = this.getSpacingBetween(prev, current);

            if (spacesBefore > 0) {
                finalHtml += this.createSpacerParagraphs(spacesBefore);
            }

            finalHtml += current.html;

            if (current.type === "article title") {
                finalHtml += this.createArticleDivider();
            }
        }

        return finalHtml;
    },

    getSpacingBetween: function (prev, current) {
        if (!prev) return 0;

        // 1 line above section headings only
        if (current.type === "prerequisites heading") return 1;
        if (current.type === "resources heading") return 1;

        // 10 lines above change log table
        if (current.type === "table block") return 10;

        // 4 lines before article title
        if (current.type === "article title") return 4;

        // 2 lines after article title divider to the next existing block
        if (prev.type === "article title") return 2;

        // 1 line after subarea title
        if (prev.type === "subarea title") return 1;

        // text/image rules
        if (prev.type === "paragraph/text" && current.type === "image block") return 1;
        if (prev.type === "image block" && current.type === "paragraph/text") return 4;
        if (prev.type === "image block" && current.type === "subarea title") return 4;
        if (prev.type === "image block" && current.type === "image block") return 1;

        // ensure absolutely 0 space under section headings
        if (prev.type === "prerequisites heading") return 0;
        if (prev.type === "resources heading") return 0;

        // compact text flow everywhere else
        if (prev.type === "paragraph/text" && current.type === "paragraph/text") return 0;
        if (prev.type === "paragraph/text" && current.type === "subarea title") return 0;

        return 0;
    }
};