/**
 * scripts/ui.js
 * Rendering and UI state management.
 */

(function() {
  'use strict';

  window.App = window.App || {};
  
  const dom = {
    entriesList: '#entries-list',
    editorTitle: '#editor-title',
    editorContent: '#editor-content',
    editorDate: '#editor-date',
    editorView: '#editor-view',
    emptyState: '#empty-state',
    toastContainer: '#toast-container',
    aiPanel: '#ai-reflection-panel',
    aiContent: '#ai-content',
    aiBtn: '#btn-ai-reflect',
    loader: '#ai-loader'
  };

  window.App.UI = {
    /**
     * Initialize UI listeners that don't depend on data yet
     */
    init: function() {
      // Create toast container if missing
      if ($(dom.toastContainer).length === 0) {
        $('body').append('<div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"></div>');
      }
    },

    /**
     * Render the list of journal entries
     */
    renderEntriesList: function(entries, activeId) {
      const $list = $(dom.entriesList);
      $list.empty();

      if (entries.length === 0) {
        $list.html(`
          <div class="text-center p-8 text-gray-400 opacity-60">
            <p class="mb-2">No thoughts yet.</p>
            <p class="text-sm">Click + to start.</p>
          </div>
        `);
        return;
      }

      entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(entry => {
        const isActive = entry.id === activeId;
        const title = entry.title || 'Untitled Thought';
        const preview = entry.content.substring(0, 40) + (entry.content.length > 40 ? '...' : '') || 'Empty note...';
        const date = window.App.Helpers.formatDate(entry.updatedAt);
        
        const $item = $(`
          <button data-id="${entry.id}" class="w-full text-left p-4 mb-2 rounded-xl transition-all duration-200 group 
            ${isActive ? 'bg-[hsl(var(--color-primary))] text-white shadow-lg' : 'bg-white hover:bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-fg))]'}">
            <div class="flex justify-between items-start mb-1">
              <span class="font-semibold truncate pr-2">${title}</span>
              <span class="text-xs opacity-70 whitespace-nowrap">${date}</span>
            </div>
            <div class="text-sm opacity-80 truncate font-light">${preview}</div>
          </button>
        `);
        
        $item.on('click', () => window.App.selectEntry(entry.id));
        $list.append($item);
      });
    },

    /**
     * Load an entry into the editor
     */
    loadEditor: function(entry) {
      if (!entry) {
        $(dom.editorView).addClass('hidden');
        $(dom.emptyState).removeClass('hidden');
        return;
      }

      $(dom.emptyState).addClass('hidden');
      $(dom.editorView).removeClass('hidden').addClass('animate-fade-up');
      
      $(dom.editorTitle).val(entry.title);
      $(dom.editorContent).val(entry.content);
      $(dom.editorDate).text(`Last saved: ${window.App.Helpers.formatTime(entry.updatedAt)}`);
      
      // Reset AI panel
      $(dom.aiPanel).addClass('hidden');
      $(dom.aiContent).empty();
    },

    /**
     * Show a toast notification
     */
    showToast: function(message, type = 'success') {
      const colors = type === 'error' ? 'bg-red-500' : 'bg-[hsl(var(--color-primary))]';
      const $toast = $(`
        <div class="${colors} text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-500 pointer-events-auto">
          <span>${message}</span>
        </div>
      `);

      $('#toast-container').append($toast);
      
      // Animate in
      requestAnimationFrame(() => {
        $toast.removeClass('translate-y-10 opacity-0');
      });

      // Remove after 3s
      setTimeout(() => {
        $toast.addClass('opacity-0 translate-y-2');
        setTimeout(() => $toast.remove(), 300);
      }, 3000);
    },

    /**
     * Update AI Loading State
     */
    setAILoading: function(isLoading, percent = 0) {
      const $btn = $(dom.aiBtn);
      const $loader = $(dom.loader);
      
      if (isLoading) {
        $btn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
        $loader.removeClass('hidden');
        if (percent > 0) {
          $loader.find('span').text(`Loading Model... ${percent}%`);
        } else {
          $loader.find('span').text('Thinking...');
        }
      } else {
        $btn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
        $loader.addClass('hidden');
      }
    },

    /**
     * Stream text into AI panel
     */
    appendAIText: function(text) {
      $(dom.aiPanel).removeClass('hidden');
      const current = $(dom.aiContent).text();
      $(dom.aiContent).text(current + text);
      // Auto scroll to bottom of panel
      const panel = document.querySelector(dom.aiPanel);
      if(panel) panel.scrollTop = panel.scrollHeight;
    }
  };
})();