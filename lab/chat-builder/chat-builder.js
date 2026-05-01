/* ====================================================================
   CHAT BUILDER — WhatsApp-style mockup tool (v2: groups + real images)
   ------------------------------------------------------------------
   TABLE OF CONTENTS
     1. CONSTANTS    (storage key, palette, default conversation)
     2. STATE        (settings + participants + messages)
     3. DOM REFS
     4. RENDER       (settings, participants, message cards, preview)
     5. EVENTS       (composer inputs, message actions, reactions, paste)
     6. IMAGES       (downsize on upload + clipboard paste)
     7. PERSIST      (versioned localStorage)
     8. BOOTSTRAP
   ------------------------------------------------------------------
   DESIGN NOTES (v2 changes from v1)

   - Storage key bumped from v1 → v2. Old v1 data ignored on first
     load post-upgrade — fresh defaults seeded. Versioning the key is
     safer than trying to migrate inline because the schema change is
     non-trivial (sender semantics changed).

   - Sender on a message is now either 'me' or a participant id, not
     a hard-coded 'them'. The composer's sender selector becomes a
     dropdown. The preview's "incoming" alignment applies to every
     non-'me' sender; bubbles in groups also show the sender's name
     in their assigned color, matching real WhatsApp group behavior.

   - Image messages now persist across reloads. Uploaded files are
     downsized to max 800px wide, JPEG-encoded at ~85% quality, and
     stored as base64 data URLs. Cuts a 4MB iPhone photo to ~80KB.
     Clipboard paste (Cmd/Ctrl+V) creates a new image message from
     whatever's on the clipboard.
   ==================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. CONSTANTS
  // ----------------------------------------------------------------
  const STORAGE_KEY = 'rycode.chat-builder.v2';

  // WhatsApp-style sender-name colors — used in group chats to color
  // each participant's name above their bubbles. Auto-assigned in
  // order; user can override per participant.
  const PARTICIPANT_COLORS = [
    '#d8504c', // orange-red
    '#00a884', // teal-green (WhatsApp brand-adjacent)
    '#9b59b6', // purple
    '#d4a84b', // mustard
    '#3498db', // blue
    '#e91e63', // pink
    '#795548', // brown
    '#1abc9c', // cyan
  ];
  const nextColor = (n) => PARTICIPANT_COLORS[n % PARTICIPANT_COLORS.length];

  const newId  = () => 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const newPid = () => 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

  function defaultParticipant(name, idx) {
    return {
      id: newPid(),
      name: name,
      initials: '',           // empty = auto-derived
      color: nextColor(idx),
    };
  }

  // Seed conversation: a 1:1 chat with Sam. To turn it into a group,
  // the user clicks + Add person.
  const DEFAULTS = () => {
    const sam = defaultParticipant('Sam', 0);
    return {
      settings: {
        groupName:     '',          // unused for 1:1; required for groups
        contactStatus: 'online',
        theme:         'dark',
        statusBarTime: '9:41',
      },
      participants: [sam],
      messages: [
        { id: newId(), sender: sam.id, type: 'text',
          text: 'are you free this weekend? was thinking of trying that new place by the lake',
          time: '7:48', reactions: [] },
        { id: newId(), sender: 'me', type: 'text',
          text: 'saturday is wide open, count me in',
          time: '7:50', reactions: [{ emoji: '❤️' }] },
        { id: newId(), sender: sam.id, type: 'image',
          imageUrl: 'https://picsum.photos/seed/lake/640/480',
          text: 'their menu — looks unreal',
          time: '7:51', reactions: [{ emoji: '🔥' }] },
        { id: newId(), sender: 'me', type: 'text',
          text: 'ok now I\'m hungry. 1pm?',
          time: '7:52', reactions: [] },
        { id: newId(), sender: sam.id, type: 'text',
          text: 'see you there',
          time: '7:53', reactions: [] },
      ],
    };
  };

  // ----------------------------------------------------------------
  // 2. STATE
  // ----------------------------------------------------------------
  let state = load() || DEFAULTS();

  // ----------------------------------------------------------------
  // 3. DOM REFS
  // ----------------------------------------------------------------
  const $groupNameField = document.getElementById('cbGroupNameField');
  const $groupName      = document.getElementById('cbGroupName');
  const $statusField    = document.getElementById('cbStatusField');
  const $statusLabel    = document.getElementById('cbStatusFieldLabel');
  const $contactStatus  = document.getElementById('cbContactStatus');
  const $theme          = document.getElementById('cbTheme');
  const $statusTime     = document.getElementById('cbStatusTime');
  const $statusTimeOut  = document.getElementById('cbStatusTimeRender');
  const $chatNameOut    = document.getElementById('cbChatName');
  const $chatStatusOut  = document.getElementById('cbChatStatus');
  const $headerAvatar   = document.getElementById('cbHeaderAvatar');
  const $phone          = document.getElementById('cbPhone');
  const $surface        = document.getElementById('cbChatSurface');
  const $msgList        = document.getElementById('cbMessageList');
  const $partList       = document.getElementById('cbParticipantList');
  const $partHint       = document.getElementById('cbParticipantsHint');
  const $addText        = document.getElementById('cbAddText');
  const $addImage       = document.getElementById('cbAddImage');
  const $reset          = document.getElementById('cbReset');
  const $addPart        = document.getElementById('cbAddParticipant');
  const $picker         = document.getElementById('cbReactionPicker');

  // ----------------------------------------------------------------
  // 4. RENDER
  // ----------------------------------------------------------------

  function deriveInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Convenience — find a participant by id; return null if 'me' or
  // missing. Centralizing this makes the rendering logic easier to
  // read.
  function getParticipant(id) {
    return state.participants.find((p) => p.id === id) || null;
  }
  function isGroup() { return state.participants.length >= 2; }

  // ——— Header preview ————————————————————————————————————

  function renderSettingsPreview() {
    const s = state.settings;
    $phone.dataset.theme = s.theme;
    $statusTimeOut.textContent = s.statusBarTime || '';

    if (isGroup()) {
      // Group mode: group name in header; member list as the status
      // line; group-letter avatar.
      const groupTitle = s.groupName || 'Group chat';
      const memberPreview = state.participants
        .map((p) => p.name || 'Unnamed')
        .join(', ') + ', You';
      $chatNameOut.textContent = groupTitle;
      $chatStatusOut.textContent = memberPreview;
      const initials = (s.groupName || 'G').slice(0, 1).toUpperCase();
      $headerAvatar.innerHTML = `<span class="cb-avatar-initials">${esc(initials)}</span>`;
      $headerAvatar.style.background = '#5b6c75';
    } else {
      // 1:1 mode: contact's name + status; their avatar in the header.
      const contact = state.participants[0];
      const name = contact ? (contact.name || ' ') : ' ';
      $chatNameOut.textContent = name;
      $chatStatusOut.textContent = s.contactStatus || ' ';
      const initials = contact
        ? ((contact.initials || '').trim() || deriveInitials(contact.name))
        : '?';
      $headerAvatar.innerHTML = `<span class="cb-avatar-initials">${esc(initials)}</span>`;
      $headerAvatar.style.background = (contact && contact.color) || '#6e7c83';
    }

    // Toggle the visibility + label of related fields based on mode.
    $groupNameField.hidden = !isGroup();
    if (isGroup()) {
      $statusLabel.textContent = '"Last seen" / sub-line (unused for groups — auto member list shown)';
      $contactStatus.disabled = true;
    } else {
      $statusLabel.textContent = 'Status / "last seen" line';
      $contactStatus.disabled = false;
    }
    $partHint.textContent = isGroup()
      ? `${state.participants.length} participants. Sender names will color-code in the preview.`
      : 'Add another person to turn this into a group chat.';
  }

  // ——— Chat surface (bubbles) ————————————————————————————

  function renderChatSurface() {
    if (state.messages.length === 0) {
      $surface.innerHTML = '<p class="cb-empty" style="color:inherit;opacity:0.5;">No messages yet — add one with the buttons on the left.</p>';
      return;
    }
    let html = '';
    let lastSender = null;
    state.messages.forEach((m, idx) => {
      if (idx === 0) html += '<div class="cb-day-sep">Today</div>';
      const grouped = (m.sender === lastSender);
      html += renderBubbleHTML(m, grouped);
      lastSender = m.sender;
    });
    $surface.innerHTML = html;
    $surface.scrollTop = $surface.scrollHeight;
  }

  function renderBubbleHTML(m, grouped) {
    const me = m.sender === 'me';
    const fromClass = me ? 'cb-from-me' : 'cb-from-them';
    const tailClass = grouped ? '' : ' cb-tailed';
    const hasRxn    = m.reactions && m.reactions.length > 0;

    // In group chats, incoming bubbles get a sender-name label at the
    // top, color-coded per participant — same as real WhatsApp.
    let senderLabel = '';
    if (!me && isGroup() && !grouped) {
      const p = getParticipant(m.sender);
      if (p) {
        senderLabel = `<span class="cb-bubble-sender" style="color:${esc(p.color)}">${esc(p.name || 'Unknown')}</span>`;
      }
    }

    let inner = senderLabel;
    if (m.type === 'image') {
      const url = m.imageUrl && m.imageUrl.trim() ? m.imageUrl.trim() : '';
      const imgTag = url
        ? `<img class="cb-bubble-image" src="${esc(url)}" alt="" onerror="this.style.background='#3a4a52';this.removeAttribute('src');" />`
        : '<div class="cb-bubble-image" role="img" aria-label="image placeholder"></div>';
      inner += imgTag;
      if (m.text) inner += `<span class="cb-bubble-caption">${esc(m.text)}</span>`;
    } else {
      inner += `<span class="cb-bubble-text">${esc(m.text || ' ')}</span>`;
    }

    const tickHTML = me ? '<span class="cb-read-tick" aria-label="Read">✓✓</span>' : '';
    inner += `<span class="cb-bubble-meta">
                <span class="cb-bubble-meta-time">${esc(m.time || '')}</span>
                ${tickHTML}
              </span>`;

    let rxnHTML = '';
    if (hasRxn) {
      const counts = {};
      m.reactions.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
      const parts = Object.entries(counts).map(([emoji, n]) =>
        n > 1 ? `${emoji}<span class="cb-rxn-count">${n}</span>` : emoji
      );
      rxnHTML = `<span class="cb-rxn-bubble">${parts.join('')}</span>`;
    }

    const rowClasses = [
      'cb-bubble-row',
      fromClass,
      grouped ? 'cb-grouped' : '',
      hasRxn ? 'cb-has-rxn' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${rowClasses}" data-msg-id="${esc(m.id)}">
        <div class="cb-bubble ${fromClass}${tailClass}">
          ${inner}
        </div>
        ${rxnHTML}
      </div>
    `;
  }

  // ——— Participant cards (composer) ——————————————————————

  function renderParticipantList() {
    if (state.participants.length === 0) {
      $partList.innerHTML = '<p class="cb-empty">No participants — add one to start.</p>';
      return;
    }
    $partList.innerHTML = state.participants.map((p, idx) => `
      <div class="cb-part-card" data-pid="${esc(p.id)}">
        <span class="cb-part-swatch" style="background:${esc(p.color)}" aria-hidden="true">
          ${esc((p.initials || '').trim() || deriveInitials(p.name))}
        </span>
        <input type="text" class="cb-input cb-part-name"
               data-field="name" value="${esc(p.name || '')}"
               placeholder="name" maxlength="40" />
        <input type="text" class="cb-input cb-part-initials"
               data-field="initials" value="${esc(p.initials || '')}"
               placeholder="auto" maxlength="2" />
        <input type="color" class="cb-part-color"
               data-field="color" value="${esc(p.color)}" aria-label="Color" />
        <button type="button" class="cb-part-remove" data-action="remove-participant"
                aria-label="Remove ${esc(p.name || 'participant')}"
                ${state.participants.length <= 1 ? 'disabled' : ''}>✕</button>
      </div>
    `).join('');
  }

  // ——— Message cards (composer) ——————————————————————————

  function renderMessageList() {
    if (state.messages.length === 0) {
      $msgList.innerHTML = '<p class="cb-empty">No messages yet. Add one with + Text or + Image above.</p>';
      return;
    }
    $msgList.innerHTML = state.messages.map((m, i) => renderMsgCardHTML(m, i)).join('');
  }

  function renderMsgCardHTML(m, idx) {
    const isLast  = idx === state.messages.length - 1;
    const isFirst = idx === 0;

    // Sender dropdown — Me + every participant.
    const senderOptions = [
      `<option value="me" ${m.sender === 'me' ? 'selected' : ''}>Me</option>`,
      ...state.participants.map((p) =>
        `<option value="${esc(p.id)}" ${m.sender === p.id ? 'selected' : ''}>${esc(p.name || 'Unnamed')}</option>`
      ),
    ].join('');

    let body = '';
    if (m.type === 'image') {
      // For data: URLs (uploaded + downsized images), the URL field is
      // huge and unreadable. Replace with a "Replace image" button.
      const isDataUrl = m.imageUrl && m.imageUrl.startsWith('data:');
      const urlInput = isDataUrl
        ? `<div class="cb-image-replace">
             <span class="cb-image-replace-label">Image embedded · saved with the conversation</span>
             <button type="button" class="cb-btn cb-btn--ghost" data-action="clear-image">Clear</button>
           </div>`
        : `<label class="cb-field">
             <span class="cb-field-label">Image URL (or paste an image with Cmd/Ctrl+V)</span>
             <input type="text" class="cb-input" data-field="imageUrl"
                    placeholder="https://… or upload below"
                    value="${esc(m.imageUrl || '')}" />
           </label>`;
      body = `
        ${urlInput}
        <label class="cb-field">
          <span class="cb-field-label">Or upload from your device</span>
          <input type="file" class="cb-input cb-input-file" accept="image/*" data-field="imageFile" />
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
          <select class="cb-msg-sender" data-field="sender" aria-label="Sender">
            ${senderOptions}
          </select>
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

  function refreshPreviewLive() {
    renderChatSurface();
    save();
  }

  function renderAll() {
    renderSettingsPreview();
    renderChatSurface();
    renderParticipantList();
    renderMessageList();
    save();
  }

  // ----------------------------------------------------------------
  // 5. EVENTS
  // ----------------------------------------------------------------

  // ——— Settings inputs (the static ones in the HTML) ———————
  $groupName    .addEventListener('input', () => { state.settings.groupName     = $groupName.value;     renderSettingsPreview(); save(); });
  $contactStatus.addEventListener('input', () => { state.settings.contactStatus = $contactStatus.value; renderSettingsPreview(); save(); });
  $statusTime   .addEventListener('input', () => { state.settings.statusBarTime = $statusTime.value;    renderSettingsPreview(); save(); });
  $theme        .addEventListener('change', () => { state.settings.theme        = $theme.value;         renderSettingsPreview(); save(); });

  // ——— Add buttons + Reset ———————————————————————————————

  $addText.addEventListener('click', () => {
    state.messages.push({
      id: newId(),
      sender: defaultSenderForNewMessage(),
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
      sender: defaultSenderForNewMessage(),
      type: 'image',
      imageUrl: '',
      text: '',
      time: nowTime(),
      reactions: [],
    });
    renderAll();
  });
  $reset.addEventListener('click', () => {
    if (!confirm('Reset to the sample conversation? Your current chat will be lost.')) return;
    state = DEFAULTS();
    hydrateSettingsFields();
    renderAll();
  });

  $addPart.addEventListener('click', () => {
    state.participants.push(defaultParticipant('New person', state.participants.length));
    renderAll();
  });

  // Default sender on a new message: the OPPOSITE of the most recent
  // sender, so the conversation alternates naturally as you type.
  // Falls back to the first participant if no messages yet.
  function defaultSenderForNewMessage() {
    const last = state.messages[state.messages.length - 1];
    if (last && last.sender === 'me') {
      return state.participants[0]?.id || 'me';
    }
    return 'me';
  }

  function nowTime() {
    const d = new Date();
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ——— Participant card events (delegated) ——————————————

  $partList.addEventListener('input', (e) => {
    const card = e.target.closest('.cb-part-card');
    if (!card) return;
    const pid = card.dataset.pid;
    const p = state.participants.find((x) => x.id === pid);
    if (!p) return;
    const field = e.target.dataset.field;
    if (field === 'name')      { p.name      = e.target.value; renderSettingsPreview(); refreshPreviewLive(); refreshSenderDropdowns(); }
    else if (field === 'initials') { p.initials = e.target.value.toUpperCase().slice(0,2); renderSettingsPreview(); save(); refreshParticipantSwatch(card, p); }
    else if (field === 'color') { p.color    = e.target.value; refreshParticipantSwatch(card, p); refreshPreviewLive(); }
  });

  // After a participant's name changes, the message-card sender
  // dropdowns need to reflect the new name. Patch in place rather
  // than re-rendering the whole list (would lose focus + slow).
  function refreshSenderDropdowns() {
    const selects = $msgList.querySelectorAll('select.cb-msg-sender');
    selects.forEach((sel) => {
      const currentVal = sel.value;
      const opts = ['<option value="me">Me</option>'];
      state.participants.forEach((p) => {
        opts.push(`<option value="${esc(p.id)}">${esc(p.name || 'Unnamed')}</option>`);
      });
      sel.innerHTML = opts.join('');
      sel.value = currentVal;
    });
  }
  function refreshParticipantSwatch(card, p) {
    const swatch = card.querySelector('.cb-part-swatch');
    if (!swatch) return;
    swatch.style.background = p.color;
    swatch.textContent = (p.initials || '').trim() || deriveInitials(p.name);
  }

  $partList.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action !== 'remove-participant') return;
    if (state.participants.length <= 1) return;
    const card = e.target.closest('.cb-part-card');
    const pid = card.dataset.pid;
    // Reassign any messages from this participant to the first
    // remaining one — better than dropping them silently.
    const remaining = state.participants.filter((p) => p.id !== pid);
    const fallback = remaining[0]?.id || 'me';
    state.messages.forEach((m) => { if (m.sender === pid) m.sender = fallback; });
    state.participants = remaining;
    renderAll();
  });

  // ——— Message card events (delegated) ——————————————————

  $msgList.addEventListener('input', (e) => {
    const card = e.target.closest('.cb-msg-card');
    if (!card) return;
    const id = card.dataset.msgId;
    const msg = state.messages.find((m) => m.id === id);
    if (!msg) return;
    const field = e.target.dataset.field;
    if (field === 'text')     { msg.text     = e.target.value; refreshPreviewLive(); return; }
    if (field === 'imageUrl') { msg.imageUrl = e.target.value; refreshPreviewLive(); return; }
    if (field === 'time')     { msg.time     = e.target.value; refreshPreviewLive(); return; }
  });

  $msgList.addEventListener('change', async (e) => {
    const card = e.target.closest('.cb-msg-card');
    if (!card) return;
    const id = card.dataset.msgId;
    const msg = state.messages.find((m) => m.id === id);
    if (!msg) return;

    if (e.target.dataset.field === 'sender') {
      msg.sender = e.target.value;
      card.dataset.sender = msg.sender;
      refreshPreviewLive();
      return;
    }
    if (e.target.dataset.field === 'imageFile') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        msg.imageUrl = await fileToCompressedDataURL(file);
        renderAll();
      } catch (err) {
        alert('Could not load that image. Try a smaller file.');
        console.warn(err);
      }
    }
  });

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
      state.messages.splice(idx, 1);
      renderAll();
    } else if (action === 'clear-image') {
      state.messages[idx].imageUrl = '';
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
  // 6. IMAGES — compression on upload + clipboard paste
  // ----------------------------------------------------------------

  // Reads a File, draws it onto a canvas downsized to MAX_W wide
  // (preserving aspect), and exports as a JPEG data URL. Cuts a 4MB
  // iPhone photo to ~80KB without obvious quality loss for screenshot
  // use. PNG with alpha would be larger; we sacrifice transparency
  // since chat photos basically never need it.
  async function fileToCompressedDataURL(file) {
    const MAX_W = 800;
    const QUALITY = 0.85;
    const blobUrl = URL.createObjectURL(file);
    try {
      const img = await loadImage(blobUrl);
      const scale = img.width > MAX_W ? MAX_W / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', QUALITY);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Clipboard paste handler — the high-leverage flow. Cmd/Ctrl+V
  // anywhere on the page with an image on the clipboard creates a
  // new image message at the end of the conversation. Skips cleanly
  // when the user is pasting text into a real input/textarea.
  document.addEventListener('paste', async (e) => {
    // Don't hijack paste when the user is typing into a text input.
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      // Exception: if it's our image-URL field, let the URL paste through.
      if (t.dataset && t.dataset.field === 'imageUrl') return;
      // Exception: if there's NO text on clipboard but there IS an image,
      // we still want to handle it — but reading clipboard items
      // requires us not to be inside a regular input. So skip here.
      return;
    }
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        try {
          const dataUrl = await fileToCompressedDataURL(file);
          state.messages.push({
            id: newId(),
            sender: defaultSenderForNewMessage(),
            type: 'image',
            imageUrl: dataUrl,
            text: '',
            time: nowTime(),
            reactions: [],
          });
          renderAll();
        } catch (err) {
          console.warn('Paste image failed', err);
        }
        return;
      }
    }
  });

  // ----------------------------------------------------------------
  // 7. PERSIST  — versioned localStorage
  // ----------------------------------------------------------------
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Quota error is most likely from too many large images.
      // Tell the user once; from then on persistence will silently
      // fail until they free space.
      if (err && err.name === 'QuotaExceededError' && !save._warned) {
        save._warned = true;
        alert('Browser storage is full. Your conversation will keep working in this tab, but won\'t survive a reload until you delete some messages.');
      } else {
        console.warn('Chat builder: could not save', err);
      }
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.settings || !Array.isArray(parsed.messages) || !Array.isArray(parsed.participants)) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  // ----------------------------------------------------------------
  // 8. BOOTSTRAP
  // ----------------------------------------------------------------
  function hydrateSettingsFields() {
    $groupName    .value = state.settings.groupName     || '';
    $contactStatus.value = state.settings.contactStatus || '';
    $statusTime   .value = state.settings.statusBarTime || '';
    $theme        .value = state.settings.theme         || 'dark';
  }

  hydrateSettingsFields();
  renderAll();

})();
