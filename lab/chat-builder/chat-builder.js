/* ====================================================================
   CHAT BUILDER — WhatsApp-style mockup tool
   ------------------------------------------------------------------
   TABLE OF CONTENTS
     1. CONSTANTS  (storage key, default conversation)
     2. STATE      (settings + messages, hydrated from localStorage)
     3. DOM REFS
     4. RENDER     (preview + composer; partial vs. full)
     5. EVENTS     (composer inputs, message actions, reactions)
     6. PERSIST    (localStorage save/load)
     7. BOOTSTRAP
   ------------------------------------------------------------------
   DESIGN NOTES
   - Single source of truth: state.{settings, messages}. Every mutation
     calls save() then a render function. Sliders/text inputs patch
     the preview live; add/remove rebuilds the message-card editor.
   - Persistence: in-memory state mirrors to localStorage on every save.
     Refresh the page and the conversation is still there.
   - Image messages support both pasted URLs and uploaded files; for
     uploads we use URL.createObjectURL() — the blob URL persists for
     the session but is intentionally NOT saved to localStorage (blob
     URLs are tab-scoped and would 404 on reload). On reload, image
     messages without a usable URL fall back gracefully to "[image]".
   ==================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. CONSTANTS
  // ----------------------------------------------------------------
  const STORAGE_KEY = 'rycode.chat-builder.v1';

  // Tiny utility — generate a stable-ish id for each new message.
  // Crypto.randomUUID() exists in modern browsers but isn't on every
  // older one we might encounter; this is good enough for client-only.
  const newId = () => 'm_' + Date.now().toString(36) + '_' +
    Math.random().toString(36).slice(2, 8);

  const DEFAULTS = () => ({
    settings: {
      contactName:     'Sam',
      contactInitials: '',
      contactStatus:   'online',
      theme:           'dark',
      statusBarTime:   '9:41',
    },
    messages: [
      {
        id: newId(),
        sender: 'them',
        type: 'text',
        text: 'are you free this weekend? was thinking of trying that new place by the lake',
        time: '7:48',
        reactions: [],
      },
      {
        id: newId(),
        sender: 'me',
        type: 'text',
        text: 'saturday is wide open, count me in',
        time: '7:50',
        reactions: [{ emoji: '❤️' }],
      },
      {
        id: newId(),
        sender: 'them',
        type: 'image',
        imageUrl: 'https://picsum.photos/seed/lake/640/480',
        text: 'their menu — looks unreal',
        time: '7:51',
        reactions: [{ emoji: '🔥' }],
      },
      {
        id: newId(),
        sender: 'me',
        type: 'text',
        text: 'ok now I\'m hungry. 1pm?',
        time: '7:52',
        reactions: [],
      },
      {
        id: newId(),
        sender: 'them',
        type: 'text',
        text: 'see you there',
        time: '7:53',
        reactions: [],
      },
    ],
  });

  // ----------------------------------------------------------------
  // 2. STATE
  // ----------------------------------------------------------------
  let state = load() || DEFAULTS();

  // ----------------------------------------------------------------
  // 3. DOM REFS  (cached at startup)
  // ----------------------------------------------------------------
  const $contactName   = document.getElementById('cbContactName');
  const $contactIni    = document.getElementById('cbContactInitials');
  const $contactStatus = document.getElementById('cbContactStatus');
  const $theme         = document.getElementById('cbTheme');
  const $statusTime    = document.getElementById('cbStatusTime');
  const $statusTimeOut = document.getElementById('cbStatusTimeRender');
  const $chatNameOut   = document.getElementById('cbChatName');
  const $chatStatusOut = document.getElementById('cbChatStatus');
  const $headerAvatar  = document.getElementById('cbHeaderAvatar');
  const $phone         = document.getElementById('cbPhone');
  const $surface       = document.getElementById('cbChatSurface');
  const $msgList       = document.getElementById('cbMessageList');
  const $addText       = document.getElementById('cbAddText');
  const $addImage      = document.getElementById('cbAddImage');
  const $reset         = document.getElementById('cbReset');
  const $picker        = document.getElementById('cbReactionPicker');

  // ----------------------------------------------------------------
  // 4. RENDER
  // ----------------------------------------------------------------

  // ——— Helpers ———————————————————————————————————————————

  // Auto-derive initials from a name when the user hasn't set them
  // explicitly. "Sam Carter" → "SC", "Sam" → "S".
  function deriveInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // HTML escape for any text that goes into innerHTML. Build Log
  // entry on this exact pattern: untrusted user input + template
  // literal + innerHTML = XSS. Escape every interpolation.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ——— Preview render ————————————————————————————————————

  function renderSettingsPreview() {
    const s = state.settings;
    $phone.dataset.theme = s.theme;
    $statusTimeOut.textContent = s.statusBarTime || '';
    $chatNameOut.textContent   = s.contactName || ' ';
    $chatStatusOut.textContent = s.contactStatus || ' ';
    const initials = (s.contactInitials || '').trim() || deriveInitials(s.contactName);
    $headerAvatar.innerHTML = `<span class="cb-avatar-initials">${esc(initials)}</span>`;
  }

  function renderChatSurface() {
    if (state.messages.length === 0) {
      $surface.innerHTML =
        '<p class="cb-empty" style="color:inherit;opacity:0.5;">No messages yet — add one with the buttons on the left.</p>';
      return;
    }
    let html = '';
    let lastSender = null;
    state.messages.forEach((m, idx) => {
      // Day separator at the very top so the chat feels anchored in time.
      if (idx === 0) html += '<div class="cb-day-sep">Today</div>';
      const grouped = (m.sender === lastSender);
      html += renderBubbleHTML(m, grouped);
      lastSender = m.sender;
    });
    $surface.innerHTML = html;
    // Auto-scroll to the bottom so the user sees the latest message
    // they're editing — same UX cue real chat apps give.
    $surface.scrollTop = $surface.scrollHeight;
  }

  function renderBubbleHTML(m, grouped) {
    const fromClass = m.sender === 'me' ? 'cb-from-me' : 'cb-from-them';
    const tailClass = grouped ? '' : ' cb-tailed';
    const hasRxn    = m.reactions && m.reactions.length > 0;
    const rowClasses = [
      'cb-bubble-row',
      fromClass,
      grouped ? 'cb-grouped' : '',
      hasRxn ? 'cb-has-rxn' : '',
    ].filter(Boolean).join(' ');

    let inner = '';
    if (m.type === 'image') {
      // Use a placeholder if no URL — keeps the bubble looking right
      // when a user has just added an image and not pasted a URL yet.
      const url = m.imageUrl && m.imageUrl.trim() ? m.imageUrl.trim() : '';
      const imgTag = url
        ? `<img class="cb-bubble-image" src="${esc(url)}" alt="" onerror="this.style.background='#3a4a52';this.removeAttribute('src');" />`
        : '<div class="cb-bubble-image" role="img" aria-label="image placeholder"></div>';
      inner += imgTag;
      if (m.text) inner += `<span class="cb-bubble-caption">${esc(m.text)}</span>`;
    } else {
      inner += `<span class="cb-bubble-text">${esc(m.text || ' ')}</span>`;
    }

    // Inline meta (time + read receipt for outgoing).
    const tickHTML = m.sender === 'me'
      ? '<span class="cb-read-tick" aria-label="Read">✓✓</span>'
      : '';
    inner += `<span class="cb-bubble-meta">
                <span class="cb-bubble-meta-time">${esc(m.time || '')}</span>
                ${tickHTML}
              </span>`;

    // Reactions hanging off the bubble (badge form).
    let rxnHTML = '';
    if (hasRxn) {
      const counts = {};
      m.reactions.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
      const parts = Object.entries(counts).map(([emoji, n]) =>
        n > 1 ? `${emoji}<span class="cb-rxn-count">${n}</span>` : emoji
      );
      rxnHTML = `<span class="cb-rxn-bubble">${parts.join('')}</span>`;
    }

    return `
      <div class="${rowClasses}" data-msg-id="${esc(m.id)}">
        <div class="cb-bubble ${fromClass}${tailClass}">
          ${inner}
        </div>
        ${rxnHTML}
      </div>
    `;
  }

  // ——— Composer (message-card editor) ————————————————————

  function renderMessageList() {
    if (state.messages.length === 0) {
      $msgList.innerHTML = '<p class="cb-empty">No messages yet. Add one with + Text or + Image above.</p>';
      return;
    }
    $msgList.innerHTML = state.messages.map((m, i) => renderMsgCardHTML(m, i)).join('');
  }

  function renderMsgCardHTML(m, idx) {
    const isMe   = m.sender === 'me';
    const isLast = idx === state.messages.length - 1;
    const isFirst = idx === 0;

    // Sender segmented toggle. Each card needs unique radio-name to
    // avoid sender selection bleeding across cards.
    const senderToggle = `
      <div class="cb-segmented" role="radiogroup" aria-label="Sender">
        <label>
          <input type="radio" name="sender-${esc(m.id)}" value="them"
                 data-field="sender" ${!isMe ? 'checked' : ''} />
          <span>Them</span>
        </label>
        <label>
          <input type="radio" name="sender-${esc(m.id)}" value="me"
                 data-field="sender" ${isMe ? 'checked' : ''} />
          <span>Me</span>
        </label>
      </div>
    `;

    // Body input — text vs. image picker.
    let body = '';
    if (m.type === 'image') {
      body = `
        <label class="cb-field">
          <span class="cb-field-label">Image URL</span>
          <input type="text" class="cb-input" data-field="imageUrl"
                 placeholder="paste a URL (or upload below)"
                 value="${esc(m.imageUrl || '')}" />
        </label>
        <label class="cb-field">
          <span class="cb-field-label">Or upload file</span>
          <input type="file" class="cb-input" accept="image/*" data-field="imageFile" />
        </label>
        <label class="cb-field">
          <span class="cb-field-label">Caption (optional)</span>
          <input type="text" class="cb-input" data-field="text"
                 maxlength="280" value="${esc(m.text || '')}" />
        </label>
      `;
    } else {
      body = `
        <label class="cb-field">
          <span class="cb-field-label">Text</span>
          <textarea class="cb-input" data-field="text" rows="2"
                    maxlength="2000">${esc(m.text || '')}</textarea>
        </label>
      `;
    }

    // Reactions row — chips + add button.
    const rxnChips = (m.reactions || []).map((r, ri) => `
      <span class="cb-rxn-chip">
        <span>${esc(r.emoji)}</span>
        <button type="button" data-action="remove-reaction" data-rxn-index="${ri}"
                aria-label="Remove ${esc(r.emoji)} reaction">×</button>
      </span>
    `).join('');

    return `
      <div class="cb-msg-card" data-msg-id="${esc(m.id)}" data-sender="${esc(m.sender)}" data-type="${esc(m.type)}">
        <div class="cb-msg-card-head">
          ${senderToggle}
          <input type="text" class="cb-msg-card-time"
                 data-field="time" value="${esc(m.time || '')}"
                 placeholder="time" maxlength="6" />
          <span class="cb-msg-card-spacer"></span>
          <div class="cb-msg-card-actions">
            <button type="button" data-action="up" aria-label="Move up" ${isFirst ? 'disabled' : ''}>↑</button>
            <button type="button" data-action="down" aria-label="Move down" ${isLast ? 'disabled' : ''}>↓</button>
            <button type="button" class="cb-act-delete" data-action="delete" aria-label="Delete message">✕</button>
          </div>
        </div>
        ${body}
        <div class="cb-msg-reactions-row">
          ${rxnChips}
          <button type="button" class="cb-add-reaction" data-action="add-reaction">+ Reaction</button>
        </div>
      </div>
    `;
  }

  // Patch only the chat surface — used after every text/time keystroke
  // so the user sees the bubble update live without re-rendering the
  // whole composer (which would lose focus mid-typing).
  function refreshPreviewLive() {
    renderChatSurface();
    save();
  }

  function renderAll() {
    renderSettingsPreview();
    renderChatSurface();
    renderMessageList();
    save();
  }

  // ----------------------------------------------------------------
  // 5. EVENTS
  // ----------------------------------------------------------------

  // ——— Settings inputs ——————————————————————————————————
  $contactName  .addEventListener('input', () => { state.settings.contactName     = $contactName.value;  renderSettingsPreview(); save(); });
  $contactIni   .addEventListener('input', () => { state.settings.contactInitials = $contactIni.value;   renderSettingsPreview(); save(); });
  $contactStatus.addEventListener('input', () => { state.settings.contactStatus   = $contactStatus.value; renderSettingsPreview(); save(); });
  $statusTime   .addEventListener('input', () => { state.settings.statusBarTime   = $statusTime.value;   renderSettingsPreview(); save(); });
  $theme        .addEventListener('change', () => { state.settings.theme          = $theme.value;        renderSettingsPreview(); save(); });

  // ——— Add / Reset ———————————————————————————————————————
  $addText.addEventListener('click', () => {
    state.messages.push({
      id: newId(),
      sender: 'them',
      type: 'text',
      text: '',
      time: nowTime(),
      reactions: [],
    });
    renderAll();
  });
  $addImage.addEventListener('click', () => {
    state.messages.push({
      id: newId(),
      sender: 'them',
      type: 'image',
      imageUrl: '',
      text: '',
      time: nowTime(),
      reactions: [],
    });
    renderAll();
  });
  $reset.addEventListener('click', () => {
    if (!confirm('Reset to the sample conversation? Your current messages will be lost.')) return;
    state = DEFAULTS();
    hydrateSettingsFields();
    renderAll();
  });

  // Returns "h:mm" current time, e.g. "9:41". Used as a sensible
  // default for new messages so the user doesn't have to type a time.
  function nowTime() {
    const d = new Date();
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ——— Composer interactions (delegated) ————————————————

  // INPUT events — text fields and the time field. Patch state and
  // refresh the preview live without rebuilding the message cards
  // (which would steal focus mid-keystroke).
  $msgList.addEventListener('input', (e) => {
    const card = e.target.closest('.cb-msg-card');
    if (!card) return;
    const id = card.dataset.msgId;
    const msg = state.messages.find((m) => m.id === id);
    if (!msg) return;
    const field = e.target.dataset.field;

    if (field === 'sender') {
      msg.sender = e.target.value;
      card.dataset.sender = msg.sender;
      refreshPreviewLive();
      return;
    }
    if (field === 'text')     { msg.text     = e.target.value; refreshPreviewLive(); return; }
    if (field === 'imageUrl') { msg.imageUrl = e.target.value; refreshPreviewLive(); return; }
    if (field === 'time')     { msg.time     = e.target.value; refreshPreviewLive(); return; }
  });

  // CHANGE events — file upload (separate from input because the
  // file picker fires change, and we need to read the file once).
  $msgList.addEventListener('change', (e) => {
    if (e.target.dataset.field !== 'imageFile') return;
    const card = e.target.closest('.cb-msg-card');
    const id = card.dataset.msgId;
    const msg = state.messages.find((m) => m.id === id);
    if (!msg) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Use a blob URL — fast, no encoding cost, but doesn't survive a
    // page reload. The URL field can be filled with a real URL by the
    // user if they want persistence across reloads.
    if (msg.imageUrl && msg.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(msg.imageUrl);
    }
    msg.imageUrl = URL.createObjectURL(file);
    // Refresh the URL input so the user can see what's bound; full
    // re-render to update the visible state.
    renderAll();
  });

  // CLICK events — actions on a message card (up/down/delete/reaction).
  $msgList.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const card = e.target.closest('.cb-msg-card');
    if (!card) return;
    const id = card.dataset.msgId;
    const idx = state.messages.findIndex((m) => m.id === id);
    if (idx < 0) return;

    if (action === 'up' && idx > 0) {
      [state.messages[idx - 1], state.messages[idx]] = [state.messages[idx], state.messages[idx - 1]];
      renderAll();
    } else if (action === 'down' && idx < state.messages.length - 1) {
      [state.messages[idx], state.messages[idx + 1]] = [state.messages[idx + 1], state.messages[idx]];
      renderAll();
    } else if (action === 'delete') {
      const msg = state.messages[idx];
      if (msg.imageUrl && msg.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(msg.imageUrl);
      }
      state.messages.splice(idx, 1);
      renderAll();
    } else if (action === 'add-reaction') {
      openReactionPicker(e.target.closest('button'), id);
    } else if (action === 'remove-reaction') {
      const ri = Number(e.target.dataset.rxnIndex);
      state.messages[idx].reactions.splice(ri, 1);
      renderAll();
    }
  });

  // ——— Reaction picker ———————————————————————————————————
  let pickerTargetMsgId = null;

  function openReactionPicker(anchorBtn, msgId) {
    pickerTargetMsgId = msgId;
    const r = anchorBtn.getBoundingClientRect();
    $picker.hidden = false;
    // Position above the button. After the picker is in the DOM we
    // can read its size; if it would overflow off-screen, flip below.
    const pw = $picker.offsetWidth;
    const ph = $picker.offsetHeight;
    let left = window.scrollX + r.left;
    let top  = window.scrollY + r.top - ph - 8;
    if (top < window.scrollY + 4) top = window.scrollY + r.bottom + 6;
    if (left + pw > window.scrollX + document.documentElement.clientWidth) {
      left = window.scrollX + document.documentElement.clientWidth - pw - 8;
    }
    $picker.style.left = left + 'px';
    $picker.style.top  = top  + 'px';
  }

  function closeReactionPicker() {
    $picker.hidden = true;
    pickerTargetMsgId = null;
  }

  $picker.addEventListener('click', (e) => {
    const emoji = e.target.dataset.emoji;
    if (!emoji || !pickerTargetMsgId) return;
    const msg = state.messages.find((m) => m.id === pickerTargetMsgId);
    if (msg) {
      msg.reactions = msg.reactions || [];
      msg.reactions.push({ emoji });
      renderAll();
    }
    closeReactionPicker();
  });

  // Close picker on outside click or Escape key.
  document.addEventListener('click', (e) => {
    if ($picker.hidden) return;
    if (e.target.closest('.cb-reaction-picker')) return;
    if (e.target.closest('[data-action="add-reaction"]')) return;
    closeReactionPicker();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$picker.hidden) closeReactionPicker();
  });

  // ----------------------------------------------------------------
  // 6. PERSIST  — localStorage save/load
  // ----------------------------------------------------------------
  function save() {
    try {
      // Skip persisting blob: URLs since they're tab-scoped and won't
      // resolve on reload. The URL input captures a pasted URL the
      // user can keep.
      const safe = JSON.parse(JSON.stringify(state));
      safe.messages.forEach((m) => {
        if (m.imageUrl && m.imageUrl.startsWith('blob:')) m.imageUrl = '';
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch (err) {
      // Quota exceeded or storage disabled — fail silently. The page
      // still works in memory; only persistence is lost.
      console.warn('Chat builder: could not save to localStorage', err);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Minimal shape check so a corrupted blob doesn't crash boot.
      if (!parsed || !parsed.settings || !Array.isArray(parsed.messages)) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  // ----------------------------------------------------------------
  // 7. BOOTSTRAP
  // ----------------------------------------------------------------

  // Hydrate the static settings inputs from state. Only run at boot
  // and on Reset — input changes after that go state → DOM via
  // renderSettingsPreview; the editable fields don't need re-pushing.
  function hydrateSettingsFields() {
    $contactName  .value = state.settings.contactName     || '';
    $contactIni   .value = state.settings.contactInitials || '';
    $contactStatus.value = state.settings.contactStatus   || '';
    $statusTime   .value = state.settings.statusBarTime   || '';
    $theme        .value = state.settings.theme           || 'dark';
  }

  hydrateSettingsFields();
  renderAll();

})();
