// settings.js
// Handles reading and writing user preferences

const Settings = {
  config: {
    autoCheck: false,
    authorName: '',
    reviewerName: '',
    businessUnit: '',
    product: '',
    productVersion: '',
    defaultKbVersion: '1.0'
  },

  init: function () {
    // Load config from Chrome storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['kbc_config'], (result) => {
        if (result.kbc_config) {
          // Merge saved config with defaults
          this.config = { ...this.config, ...result.kbc_config };
        }
        this.applySettingsToUI();
      });
    } else {
      this.applySettingsToUI();
    }
  },

  applySettingsToUI: function () {
    // Auto-check logic (kept for legacy reasons)
    const autoCheckEl = document.getElementById('kbc-auto-check');
    if (autoCheckEl) {
      autoCheckEl.checked = this.config.autoCheck;
      autoCheckEl.addEventListener('change', (e) => {
        this.config.autoCheck = e.target.checked;
        this.save();
      });
    }

    // Populate input fields
    const fields = ['authorName', 'reviewerName', 'businessUnit', 'product', 'productVersion', 'defaultKbVersion'];
    fields.forEach(field => {
      const el = document.getElementById(`kbc-setting-${field}`);
      if (el) {
        el.value = this.config[field] || '';
      }
    });
  },

  saveFromUI: function () {
    const fields = ['authorName', 'reviewerName', 'businessUnit', 'product', 'productVersion', 'defaultKbVersion'];
    fields.forEach(field => {
      const el = document.getElementById(`kbc-setting-${field}`);
      if (el) {
        this.config[field] = el.value.trim();
      }
    });
    this.save();
  },

  save: function () {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ kbc_config: this.config });
    }
  }
};
