/**
 * scripts/ai.js
 * Client-side AI integration using WebLLM.
 * NO type="module" used here.
 */

(function() {
  'use strict';

  window.AppLLM = {
    engine: null,
    ready: false,
    // Using a lightweight model suitable for quick reflections
    modelId: localStorage.getItem('app.llm.model') || 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    
    async load(modelId, updateProgress) {
      const id = modelId || this.modelId;
      if (!navigator.gpu) {
        throw new Error('WebGPU not supported. Please use Chrome 113+ or Edge 113+.');
      }
      this.modelId = id;
      localStorage.setItem('app.llm.model', id);

      // Dynamic import to load the ESM module from a regular script
      const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm@0.2.79');

      this.engine = await CreateMLCEngine(id, {
        useIndexedDBCache: true,
        initProgressCallback: (p) => {
          let percent = 0;
          if (p && typeof p === 'object' && 'progress' in p) percent = Math.floor(p.progress * 100);
          else if (typeof p === 'number') percent = Math.floor(p * 100);
          if (typeof updateProgress === 'function') updateProgress(percent);
        },
      });
      this.ready = true;
      return this.engine;
    },

    async generate(userText, { system = '', onToken } = {}) {
      if (!this.engine) throw new Error('AI Model not loaded yet.');
      this._aborted = false;
      const messages = [];
      if (system) messages.push({ role: 'system', content: system });
      messages.push({ role: 'user', content: userText });

      const stream = await this.engine.chat.completions.create({ messages, stream: true });
      for await (const chunk of stream) {
        if (this._aborted) break;
        const token = chunk?.choices?.[0]?.delta?.content || '';
        if (token && typeof onToken === 'function') onToken(token);
      }
    },

    stop() { this._aborted = true; }
  };
})();