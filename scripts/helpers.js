/**
 * scripts/helpers.js
 * General utility functions for the Echo app.
 */

(function() {
  'use strict';

  window.App = window.App || {};
  window.App.Helpers = {

    /**
     * Generate a unique ID for journal entries.
     */
    generateId: function() {
      return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format a date string into a readable format.
     * @param {string} dateString 
     * @returns {string} e.g. "Mon, Oct 24"
     */
    formatDate: function(dateString) {
      if (!dateString) return '';
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    },

    /**
     * Format time.
     */
    formatTime: function(dateString) {
       if (!dateString) return '';
       return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Debounce function for auto-saving.
     */
    debounce: function(func, wait) {
      let timeout;
      return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          func.apply(context, args);
        }, wait);
      };
    },

    /**
     * LocalStorage Wrapper with Namespace
     */
    Storage: {
      prefix: 'echo_app_',
      get: function(key) {
        try {
          const item = localStorage.getItem(this.prefix + key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          console.error('Storage Get Error:', e);
          return null;
        }
      },
      set: function(key, value) {
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (e) {
          console.error('Storage Set Error:', e);
        }
      },
      remove: function(key) {
        localStorage.removeItem(this.prefix + key);
      }
    }
  };
})();