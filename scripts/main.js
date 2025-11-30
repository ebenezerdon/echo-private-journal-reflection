/**
 * scripts/main.js
 * Entry point for Echo app.
 */

$(function() {
  'use strict';

  // Check dependencies
  if (!window.App || !window.App.UI || !window.App.Helpers) {
    console.error('CRITICAL: Modules failed to load.');
    return;
  }

  const Storage = window.App.Helpers.Storage;

  // State
  const state = {
    entries: [],
    activeEntryId: null,
    modelLoaded: false
  };

  // DOM Elements
  const el = {
    addBtn: '#btn-add',
    deleteBtn: '#btn-delete',
    editorTitle: '#editor-title',
    editorContent: '#editor-content',
    searchInput: '#search-input',
    aiBtn: '#btn-ai-reflect',
    modelProgress: '#model-progress'
  };

  // --- Core Actions ---

  window.App.init = function() {
    // Load data
    state.entries = Storage.get('entries') || [];
    window.App.UI.init();
    
    // Render initial state
    window.App.UI.renderEntriesList(state.entries, null);
    
    // Start with empty state or load last viewed if implemented
    window.App.UI.loadEditor(null);

    bindEvents();
    
    // Auto-load AI model in background if enabled/requested previously
    // or simply wait for user to click "Reflect"
    checkGPU();
  };

  window.App.selectEntry = function(id) {
    state.activeEntryId = id;
    const entry = state.entries.find(e => e.id === id);
    window.App.UI.renderEntriesList(state.entries, id);
    window.App.UI.loadEditor(entry);
  };

  function saveActiveEntry() {
    if (!state.activeEntryId) return;
    
    const title = $(el.editorTitle).val();
    const content = $(el.editorContent).val();
    const index = state.entries.findIndex(e => e.id === state.activeEntryId);
    
    if (index > -1) {
      state.entries[index] = {
        ...state.entries[index],
        title,
        content,
        updatedAt: new Date().toISOString()
      };
      Storage.set('entries', state.entries);
      window.App.UI.renderEntriesList(state.entries, state.activeEntryId);
    }
  }

  function createEntry() {
    const newEntry = {
      id: window.App.Helpers.generateId(),
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    state.entries.unshift(newEntry);
    Storage.set('entries', state.entries);
    window.App.selectEntry(newEntry.id);
    $(el.editorTitle).focus();
  }

  function deleteActiveEntry() {
    if (!state.activeEntryId) return;
    if (!confirm('Are you sure you want to delete this thought?')) return;

    state.entries = state.entries.filter(e => e.id !== state.activeEntryId);
    Storage.set('entries', state.entries);
    state.activeEntryId = null;
    
    window.App.UI.renderEntriesList(state.entries, null);
    window.App.UI.loadEditor(null);
    window.App.UI.showToast('Entry deleted', 'success');
  }

  async function handleAIReflection() {
    if (!state.activeEntryId) return;
    const entry = state.entries.find(e => e.id === state.activeEntryId);
    if (!entry || !entry.content.trim()) {
      window.App.UI.showToast('Write something first!', 'error');
      return;
    }

    try {
      window.App.UI.setAILoading(true);
      $('#ai-content').text(''); // Clear previous

      if (!state.modelLoaded) {
        // Load model
        await window.AppLLM.load(null, (percent) => {
          window.App.UI.setAILoading(true, percent);
        });
        state.modelLoaded = true;
      }

      // Generate
      window.App.UI.setAILoading(true, 0);
      const prompt = `You are a thoughtful, empathetic journaling companion. 
      Read the user's journal entry below and offer a short, 1-2 sentence gentle reflection or a question to help them dig deeper. 
      Do not be judgmental. Be brief.
      
      User Entry: "${entry.content}"`;

      await window.AppLLM.generate(prompt, {
        onToken: (token) => window.App.UI.appendAIText(token)
      });

    } catch (err) {
      console.error(err);
      window.App.UI.showToast('AI Error: ' + err.message, 'error');
    } finally {
      window.App.UI.setAILoading(false);
    }
  }

  function checkGPU() {
    if (!navigator.gpu) {
      $(el.aiBtn).hide(); // Hide AI button if not supported
    }
  }

  function bindEvents() {
    $(el.addBtn).on('click', createEntry);
    $(el.deleteBtn).on('click', deleteActiveEntry);
    
    // Debounced auto-save
    const autoSave = window.App.Helpers.debounce(saveActiveEntry, 500);
    $(el.editorTitle).on('input', autoSave);
    $(el.editorContent).on('input', autoSave);

    // Search
    $(el.searchInput).on('input', function() {
      const term = $(this).val().toLowerCase();
      const filtered = state.entries.filter(e => 
        (e.title && e.title.toLowerCase().includes(term)) || 
        (e.content && e.content.toLowerCase().includes(term))
      );
      window.App.UI.renderEntriesList(filtered, state.activeEntryId);
    });

    // AI
    $(el.aiBtn).on('click', handleAIReflection);
  }

  // Run
  try {
    window.App.init();
  } catch(e) {
    console.error('Init failed', e);
  }
});