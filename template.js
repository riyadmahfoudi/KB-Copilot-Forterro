// template.js
// Handles getting/setting content from the text editor and injecting templates

const Template = {
  // Detection Layer
  findTitleInput: function () {
    // Common selectors for article title input on Freshservice/similar platforms
    return document.querySelector('input[name="title"]') ||
      document.querySelector('input[id*="title"]') ||
      document.querySelector('.article-title-input') ||
      document.querySelector('textarea[name="title"]'); // Sometimes it's a textarea
  },

  findEditorRoot: function () {
    // Common selectors for rich text editors (Froala, Redactor, etc.)
    return document.querySelector('.fr-element.fr-view') ||
      document.querySelector('.redactor-editor') ||
      document.querySelector('[contenteditable="true"]');
  },

  isEditorReady: function () {
    // Both title input and editor root need to be present
    return this.findTitleInput() !== null && this.findEditorRoot() !== null;
  },

  observeEditor: function (onStatusChange, onReady, onTimeout) {
    if (this.isEditorReady()) {
      onStatusChange(this.findTitleInput() ? 'Title found' : 'Waiting...', this.findEditorRoot() ? 'Editor found' : 'Waiting...');
      onReady();
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; // 10 seconds of retries

    // Periodic check
    const intervalId = setInterval(() => {
      attempts++;

      const titleFound = this.findTitleInput() !== null;
      const editorFound = this.findEditorRoot() !== null;

      onStatusChange(titleFound ? 'Title found' : 'Waiting...', editorFound ? 'Editor found' : 'Waiting...');

      if (titleFound && editorFound) {
        clearInterval(intervalId);
        observer.disconnect();
        onReady();
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        observer.disconnect();
        onTimeout();
      }
    }, 500);

    // Mutation observer for robust fallback
    const observer = new MutationObserver(() => {
      const titleFound = this.findTitleInput() !== null;
      const editorFound = this.findEditorRoot() !== null;

      if (titleFound && editorFound) {
        clearInterval(intervalId);
        observer.disconnect();
        onStatusChange('Title found', 'Editor found');
        onReady();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },

  // Try to find the common WYSIWYG editor container on Freshservice
  getEditorContent: function () {
    const editor = this.findEditorRoot();
    if (editor) return editor.innerHTML;
    return "";
  },

  setEditorContent: function (html) {
    const editor = this.findEditorRoot();
    if (editor) {
      editor.innerHTML = html;
      // Dispatch an input event so the platform notices the changes
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      alert("Could not find the text editor on this page.");
    }
  },

  insertHTMLAtCursor: function (html) {
    const editor = this.findEditorRoot();
    if (editor) {
      editor.focus();
      // Use document.execCommand to insert at cursor position natively
      document.execCommand('insertHTML', false, html);
    } else {
      alert("Could not find the text editor on this page.");
    }
  },

  // Load the template dynamically (inlined for safety outside of extension context)
  loadKBTemplate: async function () {
    return `
<p>[INTRODUCTION AREA]</p>
<p>Put a description of the article content here.<br>
    The reader should understand directly what the KB is about from the description.<br>
    Don&acute;t exceed 6 lines (give or take)</p>

<p><em><strong>ps. Do NOT write a title above the introduction since a title is created from the KB name</strong></em>
</p>

<p><br></p>

<p><strong>Prerequisites</strong></p>

<p>Declare any prerequisites needed<br>
    Prerequisite 1<br>
    Prerequisite 2</p>

<p><br></p>

<p><strong>Resources</strong></p>
<p>Declare resources like hostname, IP address or URL<br>
    Resource 1</p>

<p>Resource 2</p>

<p><br></p>

<p>Any additional information goes here, link to software homepage etc</p>

<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>

<p style="font-size: 24px; font-family: Arial, sans-serif; font-weight: 400; margin-left: 0px; padding-left: 0px; text-indent: 0px;">Article text title</p>
<hr>

<p><br></p>
<p><br></p>

<p style="font-size: 18px; font-family: Arial, sans-serif; font-weight: 400; margin-left: 0px; padding-left: 0px; text-indent: 0px;">Subarea title <em>(only if the article contains multiple sub areas .. otherwise ignore)</em></p>

<p><br></p>

<p>Recommended structure involves putting an instruction, followed by a screenshot.<br>
    Key instructions should be highlighted in <strong>Bold</strong>.</p>

<p>For example, Click on the <strong>Windows Search bar</strong><br>
    Every section should request the user to do something.<br>
    Extra information (lot of text) for deeper understanding should be kept outside the KB article.</p>

<p><br></p>

<p><img
        src="https://eucattachment.freshservice.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NTAxMTk1OTQ0NTEsImRvbWFpbiI6ImhlbHBkZXNrLWZvcnRlcnJvLmZyZXNoc2VydmljZS5jb20iLCJ0eXBlIjoxfQ.X5BdFRcRKhq7Iv2SKYLQD0LtyJqwu0LZ6V-v3arP2JE">
</p>

<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>

<p>Lapsus remsus jampla ish ..</p>

<p><br></p>

<p><img
        src="https://eucattachment.freshservice.com/inline/attachment?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NTAxMTk1OTQ0NjcsImRvbWFpbiI6ImhlbHBkZXNrLWZvcnRlcnJvLmZyZXNoc2VydmljZS5jb20iLCJ0eXBlIjoxfQ.832ggdvuuLX30_zUi-UxNn9SaBsQGgo3-tIrIq3K9ZQ">
</p>

<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>
<p><br></p>

<table style="margin: 0px; padding: 0px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: 400; font-style: normal; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, sans-serif; vertical-align: middle; border-collapse: collapse; border-spacing: 0px; max-width: 100%; background-color: #FFFFFF; cursor: default; empty-cells: show; box-sizing: border-box; -webkit-font-smoothing: antialiased; width: 100%; color: #27313B;">
    <tbody style="margin: 0px; padding: 0px; border: 0px; outline: 0px; font-weight: inherit; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: baseline; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
        <tr style="margin: 0px; padding: 0px; border: 0px; outline: 0px; font-weight: inherit; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: baseline; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">KB Version</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Date Updated</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Business Unit</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Product</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Product version</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Author</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Reviewer</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased; background-color: #CCCCCC;">Change</td>
        </tr>
        <tr style="margin: 0px; padding: 0px; border: 0px; outline: 0px; font-weight: inherit; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: baseline; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">1.0</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">202Y-MM-DD</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;"><br></td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;"><br></td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;"><br></td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">Your name</td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;"><br></td>
            <td style="margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;">Document Creation</td>
        </tr>
    </tbody>
</table>

<p><br></p>
    `;
  },

  // Insert the default Forterro KB structure
  insertMainTemplate: async function () {
    const editor = this.findEditorRoot();
    if (!editor) {
      throw new Error("Could not find the text editor. Wait for it to load.");
    }

    let currentHtml = this.getEditorContent().trim();
    // Froala / rich text editors often default to just <p><br></p> when "empty"
    let hasContent = currentHtml.length > 0 && currentHtml !== '<p><br></p>' && currentHtml !== '<br>';

    if (hasContent) {
      const confirmReplace = confirm("The editor already contains content. Are you sure you want to replace it with the template?");
      if (!confirmReplace) {
        return false; // User cancelled
      }
    }

    let finalHtml = await this.loadKBTemplate();

    // Load configs from Settings or default
    const config = (typeof Settings !== 'undefined') ? Settings.config : {};

    // Use DOMParser to safely inject the variables into the actual template structure before insertion
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
    this.setEditorContent(finalHtml);
    return true; // Success
  },

  // Append a new row to the existing Change Log table
  addChangeLogEntry: function () {
    const editor = this.findEditorRoot();
    if (!editor) {
      throw new Error("Editor not found.");
    }

    const tables = editor.querySelectorAll('table');
    if (tables.length === 0) {
      throw new Error("Change Log table not found. Please insert the template first.");
    }

    // Assuming the change log is the last table
    const table = tables[tables.length - 1];
    const tableBody = table.querySelector('tbody');

    if (!tableBody) {
      throw new Error("Change Log table body not found.");
    }

    const config = (typeof Settings !== 'undefined') ? Settings.config : {};

    // Get the previous version to increment
    let newVersionStr = config.defaultKbVersion || "1.1";
    // Get the rows
    const rows = tableBody.querySelectorAll('tr');
    // Usually row 0 is header. Row 1 is the latest change. Let's find the first data row.
    if (rows.length > 1) {
      // Let's look at the first data row (usually row 1)
      const firstDataRow = rows[1];
      if (firstDataRow) {
        const cells = firstDataRow.querySelectorAll('td');
        if (cells.length > 0) {
          const lastVersion = parseFloat(cells[0].textContent.trim());
          if (!isNaN(lastVersion)) {
            // increment by 0.1
            newVersionStr = (lastVersion + 0.1).toFixed(1);
          }
        }
      }
    }

    const dateUpdated = new Date().toISOString().split('T')[0];
    const authorName = config.authorName || "";
    const reviewerName = config.reviewerName || "";
    const businessUnit = config.businessUnit || "";
    const product = config.product || "";
    const productVersion = config.productVersion || "";
    const changeDesc = "Updated article";

    // Style for TD cells (matching FreshService native table style)
    const tdStyle = "margin: 0px; padding: 4px; border-width: 1px; border-style: solid; border-color: #C9D3DB; border-image: none 100% / 1 / 0 stretch; outline: 0px; font-weight: normal; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: top; text-align: center; cursor: text; user-select: text; min-width: 5px; box-sizing: border-box; -webkit-font-smoothing: antialiased;";

    const newRowHTML = `
        <tr style="margin: 0px; padding: 0px; border: 0px; outline: 0px; font-weight: inherit; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: baseline; box-sizing: border-box; -webkit-font-smoothing: antialiased;">
            <td style="${tdStyle}">${newVersionStr}</td>
            <td style="${tdStyle}">${dateUpdated}</td>
            <td style="${tdStyle}">${businessUnit || '<br>'}</td>
            <td style="${tdStyle}">${product || '<br>'}</td>
            <td style="${tdStyle}">${productVersion || '<br>'}</td>
            <td style="${tdStyle}">${authorName || '<br>'}</td>
            <td style="${tdStyle}">${reviewerName || '<br>'}</td>
            <td style="${tdStyle}">${changeDesc}</td>
        </tr>
    `;

    // Insert below header row (index 0) and above the rest
    if (rows.length > 0) {
      rows[0].insertAdjacentHTML('afterend', newRowHTML);
    } else {
      tableBody.insertAdjacentHTML('beforeend', newRowHTML);
    }

    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
};
