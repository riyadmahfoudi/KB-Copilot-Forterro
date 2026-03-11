// validator.js
// Checks the KB article for the presence of required sections

const Validator = {
    checkTemplate: function () {
        const editor = Template.findEditorRoot();
        const list = document.getElementById('kbc-warnings-list');
        if (!list) return;

        // Clear previous warnings
        list.innerHTML = '';

        if (!editor) {
            const li = document.createElement('li');
            li.textContent = 'Editor not found. Cannot check template.';
            li.style.color = '#e53e3e';
            list.appendChild(li);
            throw new Error("Editor not found.");
        }

        let hasWarnings = false;

        // Inspect the actual editor DOM text content
        const textContent = editor.textContent || editor.innerText || '';
        const textLower = textContent.toLowerCase();

        // Keys are lowercase to match the .toLowerCase() string
        const textChecks = [
            { key: 'introduction area', msg: "Missing 'INTRODUCTION AREA' section" },
            { key: 'prerequisites', msg: "Missing 'Prerequisites' section" },
            { key: 'resources', msg: "Missing 'Resources' section" },
            { key: 'article text title', msg: "Missing 'Article text title'" }
        ];

        // Evaluate each text-based required section
        textChecks.forEach(check => {
            if (!textLower.includes(check.key)) {
                this.addWarning(list, check.msg);
                hasWarnings = true;
            }
        });

        // Evaluate DOM-based elements using actual editor DOM
        const tables = editor.querySelectorAll('table');
        if (tables.length === 0) {
            this.addWarning(list, "Missing Change Log table");
            hasWarnings = true;
        }

        const images = editor.querySelectorAll('img');
        if (images.length === 0) {
            this.addWarning(list, "Missing image in the article body");
            hasWarnings = true;
        }

        // Provide positive feedback if everything is correct
        if (!hasWarnings) {
            const li = document.createElement('li');
            li.textContent = 'No major template issues found.';
            li.style.color = '#38a169'; // Green success color
            list.appendChild(li);
            return true;
        }

        return false;
    },

    addWarning: function (list, msg) {
        const li = document.createElement('li');
        li.textContent = msg;
        li.style.color = '#e53e3e';
        list.appendChild(li);
    }
};
