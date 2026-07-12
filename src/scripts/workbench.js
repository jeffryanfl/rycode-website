import { WorkbenchStore } from './workbench-store.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const store = new WorkbenchStore();
  
  // State
  let activeFilters = {
    type: 'all', // 'all', 'note', 'task', 'pinned'
    tag: null,   // null or string tag
    search: ''   // search string
  };
  
  let currentLayout = 'grid'; // 'grid' (masonry) or 'list'
  let tokenClient = null;     // Google OAuth client handler
  let activeSuggestions = []; // Command bar suggestions list
  let selectedSuggestionIndex = 0;

  // DOM Cache
  const sidebarItemsList = document.getElementById('sidebarItemsList');
  const sidebarTagsCloud = document.getElementById('sidebarTagsCloud');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');
  const filterChips = document.querySelectorAll('.filter-chip');
  
  const pinnedSection = document.getElementById('pinnedSection');
  const pinnedGrid = document.getElementById('pinnedGrid');
  const masonryBoard = document.getElementById('masonryBoard');
  const listBoard = document.getElementById('listBoard');
  const listTableBody = document.getElementById('listTableBody');
  
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewListBtn = document.getElementById('viewListBtn');
  const quickCreateBtn = document.getElementById('quickCreateBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  
  // Modals
  const commandBarModal = document.getElementById('commandBarModal');
  const commandBarInput = document.getElementById('commandBarInput');
  const commandSuggestions = document.getElementById('commandSuggestions');
  
  const itemEditorModal = document.getElementById('itemEditorModal');
  const editorForm = document.getElementById('editorForm');
  const editItemId = document.getElementById('editItemId');
  const editTitle = document.getElementById('editTitle');
  const editContent = document.getElementById('editContent');
  const editPriority = document.getElementById('editPriority');
  const editColor = document.getElementById('editColor');
  const editTags = document.getElementById('editTags');
  const editorCloseBtn = document.getElementById('editorCloseBtn');
  const editorCancelBtn = document.getElementById('editorCancelBtn');
  const editorDeleteBtn = document.getElementById('editorDeleteBtn');
  const editorContentGroup = document.getElementById('editorContentGroup');
  const editorChecklistGroup = document.getElementById('editorChecklistGroup');
  const addChecklistItemBtn = document.getElementById('addChecklistItemBtn');
  const checklistBuilderRows = document.getElementById('checklistBuilderRows');
  const typeSelectButtons = document.querySelectorAll('.type-select-btn');

  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const settingsClientId = document.getElementById('settingsClientId');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const googleSignOutBtn = document.getElementById('googleSignOutBtn');
  const settingsConnectionInfo = document.getElementById('settingsConnectionInfo');
  
  const syncStatusWidget = document.getElementById('syncStatusWidget');
  const syncStatusText = document.getElementById('syncStatusText');

  // ===========================================================
  // INITIALIZATION & EVENT LISTENERS
  // ===========================================================
  
  function init() {
    // Fill client ID if saved in settings
    if (store.settings.googleClientId) {
      settingsClientId.value = store.settings.googleClientId;
      initGoogleAuth(false); // Init silently
    }
    
    // Wire Store Sync status changes to HUD header
    store.onSyncChange = (status, msg) => {
      syncStatusWidget.className = `sync-status-widget ${status}`;
      syncStatusText.textContent = status === 'synced' ? 'Synced' : status.toUpperCase();
      
      // Update Settings screen info panel
      if (status === 'synced' || status === 'connected') {
        let text = `Connected Account: ${store.settings.userEmail || 'Active Google Session'}\n`;
        text += `Drive Backup File ID: ${store.settings.googleFileId || 'Creating...'}\n`;
        text += `Status: ${msg}`;
        settingsConnectionInfo.textContent = text;
        googleSignOutBtn.classList.remove('hidden');
        googleSignInBtn.querySelector('span').textContent = 'Sync Refresh';
      } else if (status === 'disconnected') {
        settingsConnectionInfo.textContent = 'Offline Mode. Notes stored in browser LocalStorage only.';
        googleSignOutBtn.classList.add('hidden');
        googleSignInBtn.querySelector('span').textContent = 'Authorize & Connect';
      } else {
        settingsConnectionInfo.textContent = msg;
      }
    };

    // Load initial sync status state if saved
    if (store.settings.accessToken) {
      if (Date.now() < store.settings.tokenExpiry) {
        store.triggerSync();
      } else {
        store.updateSyncStatus('disconnected', 'Google session expired. Please reconnect.');
      }
    } else {
      store.updateSyncStatus('disconnected', 'Not connected to cloud sync.');
    }

    render();
  }

  // Event Listeners
  window.addEventListener('workbench-store-updated', render);
  
  // Search input typing filters active items
  sidebarSearchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value;
    render();
  });

  // Filter chips click handlers
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilters.type = chip.dataset.type;
      render();
    });
  });

  // Layout switcher buttons
  viewGridBtn.addEventListener('click', () => {
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    currentLayout = 'grid';
    render();
  });

  viewListBtn.addEventListener('click', () => {
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    currentLayout = 'list';
    render();
  });

  // Create FAB
  quickCreateBtn.addEventListener('click', () => openEditor());

  // Settings modals triggers
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  settingsCloseBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  // ===========================================================
  // RENDER WORKSPACE CARDS / OUTLINE / TAGS
  // ===========================================================

  function render() {
    const items = store.getActiveItems();
    
    // Filter items based on active filters
    const filtered = items.filter(item => {
      // 1. Search Query
      if (activeFilters.search) {
        const query = activeFilters.search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesContent = item.content && item.content.toLowerCase().includes(query);
        const matchesTags = item.tags && item.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }
      
      // 2. Type/Category
      if (activeFilters.type === 'note' && item.type !== 'note') return false;
      if (activeFilters.type === 'task' && item.type !== 'task') return false;
      if (activeFilters.type === 'pinned' && !item.pinned) return false;
      
      // 3. Tags Selection
      if (activeFilters.tag && (!item.tags || !item.tags.includes(activeFilters.tag))) return false;
      
      return true;
    });

    // Separate pinned vs standard
    const pinnedItems = filtered.filter(item => item.pinned);
    const standardItems = filtered.filter(item => !item.pinned);

    // Update index outline sidebar list
    renderSidebarOutline(filtered);

    // Update active tag cloud list
    renderTagCloud(items);

    // Render active board grid or tabular list view
    if (currentLayout === 'grid') {
      masonryBoard.classList.remove('hidden');
      listBoard.classList.add('hidden');
      
      // Render Pinned Grid if elements exist
      if (pinnedItems.length > 0) {
        pinnedSection.classList.remove('hidden');
        pinnedGrid.innerHTML = '';
        pinnedItems.forEach(item => {
          pinnedGrid.appendChild(createCardElement(item));
        });
      } else {
        pinnedSection.classList.add('hidden');
      }

      // Render Masonry standard items
      renderMasonryBoard(standardItems);
    } else {
      masonryBoard.classList.add('hidden');
      pinnedSection.classList.add('hidden');
      listBoard.classList.remove('hidden');
      
      renderListBoard(filtered);
    }
  }

  // Sidebar outline list view renderer
  function renderSidebarOutline(items) {
    sidebarItemsList.innerHTML = '';
    
    if (items.length === 0) {
      sidebarItemsList.innerHTML = '<span class="tag-empty">No items match filters</span>';
      return;
    }

    // Sort outline: Pinned first, then sorted by updatedAt
    const sorted = [...items].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

    sorted.forEach(item => {
      const el = document.createElement('div');
      el.className = 'outline-item';
      
      const typeLabel = item.type === 'task' ? '📋' : '💡';
      const pinLabel = item.pinned ? '📌' : '';
      
      el.innerHTML = `
        <div class="outline-left">
          <span class="outline-title">${pinLabel} ${typeLabel} ${item.title}</span>
          <div class="outline-meta">
            <span class="outline-dot ${item.priority || 'medium'}"></span>
            <span>${new Date(item.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      `;
      
      el.addEventListener('click', () => {
        // Highlight active sidebar item
        document.querySelectorAll('.outline-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        
        // Open Editor modal directly on click
        openEditor(item);
      });

      sidebarItemsList.appendChild(el);
    });
  }

  // Sidebar dynamic tag cloud renderer
  function renderTagCloud(allItems) {
    sidebarTagsCloud.innerHTML = '';
    
    const tagCount = {};
    allItems.forEach(item => {
      if (item.deleted) return;
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          const t = tag.trim().toLowerCase();
          if (t) tagCount[t] = (tagCount[t] || 0) + 1;
        });
      }
    });

    const tags = Object.keys(tagCount).sort();

    if (tags.length === 0) {
      sidebarTagsCloud.innerHTML = '<span class="tag-empty">No tags created yet</span>';
      return;
    }

    tags.forEach(tag => {
      const el = document.createElement('span');
      el.className = 'sidebar-tag-item';
      if (activeFilters.tag === tag) el.classList.add('active');
      el.textContent = `#${tag} (${tagCount[tag]})`;
      
      el.addEventListener('click', () => {
        if (activeFilters.tag === tag) {
          activeFilters.tag = null; // Toggle off filter
        } else {
          activeFilters.tag = tag; // Toggle on filter
        }
        render();
      });

      sidebarTagsCloud.appendChild(el);
    });
  }

  // Masonry Grid column rendering logic
  function renderMasonryBoard(items) {
    masonryBoard.innerHTML = '';
    
    if (items.length === 0) {
      masonryBoard.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-mute); padding: 3rem 0;">No active cards in workspace. Press Cmd+K or create a Quick Item to get started!</div>';
      return;
    }

    // Determine responsive column counts
    let colCount = 3;
    const width = window.innerWidth;
    if (width < 768) colCount = 1;
    else if (width < 1024) colCount = 2;
    
    // Create column containers
    const cols = [];
    for (let i = 0; i < colCount; i++) {
      const colDiv = document.createElement('div');
      colDiv.className = 'masonry-column';
      masonryBoard.appendChild(colDiv);
      cols.push(colDiv);
    }

    // Distribute cards in column lanes round-robin
    items.forEach((item, index) => {
      const colIndex = index % colCount;
      cols[colIndex].appendChild(createCardElement(item));
    });
  }

  // Table row renderer for compact list view
  function renderListBoard(items) {
    listTableBody.innerHTML = '';
    
    if (items.length === 0) {
      listTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-mute);">No active items found matching search queries.</td></tr>';
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      
      const typeIcon = item.type === 'task' ? '📋 Task' : '💡 Note';
      const pinIcon = item.pinned ? '📌' : '';
      const priorityLabel = `<span class="priority-badge ${item.priority}">${item.priority}</span>`;
      const tagsList = item.tags ? item.tags.map(t => `#${t}`).join(', ') : '';
      const formattedDate = new Date(item.updatedAt).toLocaleDateString() + ' ' + new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      tr.innerHTML = `
        <td style="text-align: center;">${pinIcon}</td>
        <td style="font-weight: 600;">${item.title}</td>
        <td>${typeIcon}</td>
        <td>${priorityLabel}</td>
        <td style="color: var(--accent); font-size: 0.75rem;">${tagsList}</td>
        <td>${formattedDate}</td>
        <td>
          <div class="list-actions">
            <button class="card-action-btn pin-row" title="Pin Toggle">${item.pinned ? '📌' : '📍'}</button>
            <button class="card-action-btn delete-row" title="Delete Card">🗑️</button>
          </div>
        </td>
      `;

      // Clicks open edit modal
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.card-action-btn')) return; // Ignore row button clicks
        openEditor(item);
      });

      // Actions click handlers
      tr.querySelector('.pin-row').addEventListener('click', (e) => {
        e.stopPropagation();
        item.pinned = !item.pinned;
        store.saveItem(item);
      });

      tr.querySelector('.delete-row').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
          store.deleteItem(item.id);
        }
      });

      listTableBody.appendChild(tr);
    });
  }

  // Card DOM element builder
  function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'workbench-card';
    card.dataset.id = item.id;
    
    // Set custom highlighting color top stripe
    const stripe = document.createElement('div');
    stripe.className = 'card-color-stripe';
    stripe.style.backgroundColor = item.color || '#eff6ff';
    card.appendChild(stripe);

    // 1. Header info
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const titleGroup = document.createElement('div');
    titleGroup.className = 'card-title-group';
    
    const title = document.createElement('h3');
    title.textContent = item.title;
    titleGroup.appendChild(title);
    
    const metaRow = document.createElement('div');
    metaRow.className = 'card-meta-row';
    
    const typeIcon = document.createElement('span');
    typeIcon.className = 'card-type-icon';
    typeIcon.innerHTML = item.type === 'task' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
    metaRow.appendChild(typeIcon);

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge ${item.priority || 'medium'}`;
    priorityBadge.textContent = item.priority || 'medium';
    metaRow.appendChild(priorityBadge);
    
    titleGroup.appendChild(metaRow);
    header.appendChild(titleGroup);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    const pinBtn = document.createElement('button');
    pinBtn.className = `card-action-btn ${item.pinned ? 'pin-active' : ''}`;
    pinBtn.title = item.pinned ? 'Unpin Card' : 'Pin Card';
    pinBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.33-2.91a2 2 0 0 1-.43-1.24V4a2 2 0 0 0-2-2h-3.6a2 2 0 0 0-2 2v5.85a2 2 0 0 1-.43 1.24l-2.33 2.91a2 2 0 0 0-.44 1.24z"/></svg>';
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      item.pinned = !item.pinned;
      store.saveItem(item);
    });
    actions.appendChild(pinBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'card-action-btn';
    editBtn.title = 'Edit Item';
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor(item);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-action-btn btn-delete-card';
    deleteBtn.title = 'Delete Card';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
        store.deleteItem(item.id);
      }
    });
    actions.appendChild(deleteBtn);

    header.appendChild(actions);
    card.appendChild(header);

    // 2. Card Content Body
    const body = document.createElement('div');
    body.className = 'card-body';
    
    if (item.type === 'task') {
      // Checklist items
      if (item.checklist && item.checklist.length > 0) {
        const checklistContainer = document.createElement('div');
        checklistContainer.className = 'card-checklist';
        
        let completed = 0;
        
        item.checklist.forEach((checkItem, checkIdx) => {
          const row = document.createElement('div');
          row.className = `card-checklist-item ${checkItem.checked ? 'checked' : ''}`;
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = checkItem.checked;
          checkbox.ariaLabel = checkItem.text;
          
          if (checkItem.checked) completed++;

          row.appendChild(checkbox);
          
          const textSpan = document.createElement('span');
          textSpan.textContent = checkItem.text;
          row.appendChild(textSpan);

          // Click handler toggles status directly on Card view!
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            // Toggle value
            item.checklist[checkIdx].checked = !item.checklist[checkIdx].checked;
            store.saveItem(item);
          });

          checklistContainer.appendChild(row);
        });

        body.appendChild(checklistContainer);

        // Progress bar indicator
        const percentage = Math.round((completed / item.checklist.length) * 100);
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'card-progress-container';
        
        const bar = document.createElement('div');
        bar.className = 'card-progress-bar';
        const fill = document.createElement('div');
        fill.className = 'card-progress-fill';
        fill.style.width = `${percentage}%`;
        bar.appendChild(fill);
        
        progressContainer.appendChild(bar);
        
        const val = document.createElement('span');
        val.className = 'card-progress-val';
        val.textContent = `${completed}/${item.checklist.length}`;
        progressContainer.appendChild(val);
        
        body.appendChild(progressContainer);
      }
      
      // Text description under checklist if it exists
      if (item.content) {
        const desc = document.createElement('div');
        desc.style.marginTop = '0.5rem';
        desc.textContent = item.content;
        body.appendChild(desc);
      }
    } else {
      // Normal Note Text Content
      body.textContent = item.content;
    }
    
    card.appendChild(body);

    // 3. Card tags list
    if (item.tags && item.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'card-tags';
      item.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'card-tag';
        span.textContent = `#${tag}`;
        tagsDiv.appendChild(span);
      });
      card.appendChild(tagsDiv);
    }

    // Card click opens full editor modal
    card.addEventListener('click', () => openEditor(item));

    return card;
  }

  // ===========================================================
  // ITEM EDITOR MODAL CONTROLLER
  // ===========================================================
  
  let editorType = 'note';
  let activeChecklistRows = [];

  // Toggle item types in form
  typeSelectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeSelectButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editorType = btn.dataset.type;
      
      if (editorType === 'task') {
        editorContentGroup.classList.add('hidden');
        editorChecklistGroup.classList.remove('hidden');
      } else {
        editorContentGroup.classList.remove('hidden');
        editorChecklistGroup.classList.add('hidden');
      }
    });
  });

  // Open note/task form editor modal
  function openEditor(item = null) {
    editorForm.reset();
    checklistBuilderRows.innerHTML = '';
    activeChecklistRows = [];
    
    if (item) {
      // Load existing item
      editItemId.value = item.id;
      editTitle.value = item.title;
      editPriority.value = item.priority || 'medium';
      editColor.value = item.color || '#eff6ff';
      editTags.value = item.tags ? item.tags.join(', ') : '';
      
      editorType = item.type;
      typeSelectButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === item.type);
      });
      
      if (item.type === 'task') {
        editorContentGroup.classList.add('hidden');
        editorChecklistGroup.classList.remove('hidden');
        editContent.value = item.content || '';
        
        // Build checklist input rows
        if (item.checklist && item.checklist.length > 0) {
          item.checklist.forEach(checkItem => {
            addChecklistRowInput(checkItem.text, checkItem.checked);
          });
        } else {
          addChecklistRowInput();
        }
      } else {
        editorContentGroup.classList.remove('hidden');
        editorChecklistGroup.classList.add('hidden');
        editContent.value = item.content || '';
      }
      
      editorDeleteBtn.classList.remove('hidden');
      document.getElementById('editorModalTitle').textContent = `Edit ${item.type === 'task' ? 'Task' : 'Note'}`;
    } else {
      // Create new item
      editItemId.value = '';
      editorType = 'note';
      typeSelectButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'note');
      });
      editorContentGroup.classList.remove('hidden');
      editorChecklistGroup.classList.add('hidden');
      
      editorDeleteBtn.classList.add('hidden');
      document.getElementById('editorModalTitle').textContent = 'New Workbench Item';
      addChecklistRowInput();
    }
    
    itemEditorModal.classList.remove('hidden');
  }

  // Close triggers
  function closeEditor() {
    itemEditorModal.classList.add('hidden');
  }
  
  editorCloseBtn.addEventListener('click', closeEditor);
  editorCancelBtn.addEventListener('click', closeEditor);
  
  // Delete handler from inside form editor
  editorDeleteBtn.addEventListener('click', () => {
    const id = editItemId.value;
    if (id && confirm('Are you sure you want to delete this item?')) {
      store.deleteItem(id);
      closeEditor();
    }
  });

  // Add checklist input row in builder
  addChecklistItemBtn.addEventListener('click', () => addChecklistRowInput());

  function addChecklistRowInput(text = '', checked = false) {
    const rowId = 'check-row-' + Math.random().toString(36).substr(2, 9);
    
    const row = document.createElement('div');
    row.className = 'builder-row';
    row.id = rowId;
    
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    row.appendChild(cb);
    
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = 'Action checklist task...';
    inp.value = text;
    row.appendChild(inp);
    
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'card-action-btn btn-delete-card';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', () => {
      row.remove();
      activeChecklistRows = activeChecklistRows.filter(r => r.id !== rowId);
    });
    row.appendChild(delBtn);

    checklistBuilderRows.appendChild(row);
    
    activeChecklistRows.push({
      id: rowId,
      checkbox: cb,
      input: inp
    });

    // Auto-focus new row
    if (text === '') inp.focus();
  }

  // Handle submit form (Save / Update item)
  editorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = editItemId.value || 'item-' + Date.now() + Math.random().toString(36).substr(2, 9);
    const title = editTitle.value.trim();
    const priority = editPriority.value;
    const color = editColor.value;
    
    // Parse tags list
    const tags = editTags.value
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const itemData = {
      id,
      title,
      type: editorType,
      priority,
      color,
      tags,
      pinned: false
    };

    // If updating existing, preserve previous pinned status
    if (editItemId.value) {
      const existing = store.getItems().find(item => item.id === editItemId.value);
      if (existing) itemData.pinned = existing.pinned;
    }

    if (editorType === 'task') {
      // Tasks content is description + checklist array
      itemData.content = editContent.value.trim();
      itemData.checklist = activeChecklistRows
        .map(row => ({
          text: row.input.value.trim(),
          checked: row.checkbox.checked
        }))
        .filter(item => item.text.length > 0);
    } else {
      // Notes content
      itemData.content = editContent.value.trim();
    }

    store.saveItem(itemData);
    closeEditor();
  });

  // ===========================================================
  // SPOTLIGHT / COMMAND BAR (`Cmd+K` / `Ctrl+K`)
  // ===========================================================
  
  // Commands set config
  const commandDefs = [
    { cmd: '/note', desc: 'Create a new note item', shortcut: 'Enter', action: (title) => createItemFromCommand('note', title) },
    { cmd: '/todo', desc: 'Create a new task item', shortcut: 'Enter', action: (title) => createItemFromCommand('task', title) },
    { cmd: '/list', desc: 'Switch layout to compact list view', shortcut: '⏎', action: () => { currentLayout = 'list'; render(); viewListBtn.classList.add('active'); viewGridBtn.classList.remove('active'); } },
    { cmd: '/grid', desc: 'Switch layout to masonry grid board', shortcut: '⏎', action: () => { currentLayout = 'grid'; render(); viewGridBtn.classList.add('active'); viewListBtn.classList.remove('active'); } },
    { cmd: '/settings', desc: 'Open Google Drive Cloud sync settings', shortcut: '⏎', action: () => settingsModal.classList.remove('hidden') },
    { cmd: '/close', desc: 'Close this search command bar', shortcut: 'ESC', action: () => toggleCommandBar(false) }
  ];

  // Hotkey listener
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandBar();
    }
    
    // Close modal on escape
    if (e.key === 'Escape') {
      if (!commandBarModal.classList.contains('hidden')) {
        toggleCommandBar(false);
      } else if (!itemEditorModal.classList.contains('hidden')) {
        closeEditor();
      } else if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      }
    }
  });

  // Toggle overlay console
  function toggleCommandBar(forceState = null) {
    const show = forceState !== null ? forceState : commandBarModal.classList.contains('hidden');
    
    if (show) {
      commandBarModal.classList.remove('hidden');
      commandBarInput.value = '';
      commandBarInput.focus();
      renderSuggestions('');
    } else {
      commandBarModal.classList.add('hidden');
    }
  }

  // Type actions inside command overlay
  commandBarInput.addEventListener('input', (e) => {
    renderSuggestions(e.target.value);
  });

  // Suggested commands renderer
  function renderSuggestions(text) {
    commandSuggestions.innerHTML = '';
    selectedSuggestionIndex = 0;
    
    const query = text.trim().toLowerCase();
    
    if (query.startsWith('/')) {
      // Filter commands
      activeSuggestions = commandDefs.filter(c => c.cmd.startsWith(query));
    } else {
      // Default list when empty or typing titles directly
      activeSuggestions = commandDefs;
    }

    if (activeSuggestions.length === 0) {
      // If typing a title directly (e.g. typing "Buy milk") suggest creating note or task!
      activeSuggestions = [
        { cmd: `/note ${text}`, desc: `Create new Note: "${text}"`, shortcut: 'Enter', action: () => createItemFromCommand('note', text) },
        { cmd: `/todo ${text}`, desc: `Create new Task: "${text}"`, shortcut: 'Enter', action: () => createItemFromCommand('task', text) }
      ];
    }

    activeSuggestions.forEach((sug, idx) => {
      const div = document.createElement('div');
      div.className = `suggestion-item ${idx === selectedSuggestionIndex ? 'selected' : ''}`;
      
      const icon = sug.cmd.includes('/note') ? '💡' : sug.cmd.includes('/todo') ? '📋' : '⚙️';
      
      div.innerHTML = `
        <div class="suggestion-left">
          <span class="suggestion-icon">${icon}</span>
          <span class="suggestion-cmd">${sug.cmd}</span>
          <span class="suggestion-desc">${sug.desc}</span>
        </div>
        <span class="suggestion-shortcut">${sug.shortcut}</span>
      `;

      div.addEventListener('click', () => {
        executeSuggestion(sug);
      });

      commandSuggestions.appendChild(div);
    });
  }

  // Keyboard navigation inside suggested commands list
  commandBarInput.addEventListener('keydown', (e) => {
    const listItems = commandSuggestions.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIndex = (selectedSuggestionIndex + 1) % activeSuggestions.length;
      updateSuggestionSelection(listItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestionIndex = (selectedSuggestionIndex - 1 + activeSuggestions.length) % activeSuggestions.length;
      updateSuggestionSelection(listItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestions[selectedSuggestionIndex]) {
        executeSuggestion(activeSuggestions[selectedSuggestionIndex]);
      }
    }
  });

  function updateSuggestionSelection(listItems) {
    listItems.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedSuggestionIndex);
      if (idx === selectedSuggestionIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // Suggestion action executer
  function executeSuggestion(sug) {
    const rawVal = commandBarInput.value;
    
    if (sug.cmd.startsWith('/note') || sug.cmd.startsWith('/todo')) {
      // Extract parameter argument title
      const cmdParts = rawVal.split(' ');
      cmdParts.shift(); // Remove '/note' or '/todo'
      const title = cmdParts.join(' ').trim();
      sug.action(title);
    } else {
      sug.action();
    }
    
    toggleCommandBar(false);
  }

  // Quick create command worker
  function createItemFromCommand(type, titleText) {
    const cleanTitle = titleText ? titleText.trim() : `Draft ${type === 'task' ? 'Task' : 'Note'}`;
    
    const newItem = {
      id: 'item-' + Date.now() + Math.random().toString(36).substr(2, 9),
      title: cleanTitle,
      type: type,
      content: '',
      priority: 'medium',
      color: type === 'task' ? '#fffbeb' : '#eff6ff',
      tags: [],
      pinned: false
    };

    if (type === 'task') {
      newItem.checklist = [];
    }

    store.saveItem(newItem);
    openEditor(newItem); // Open editor modal immediately so they can write content
  }

  // ===========================================================
  // GOOGLE DRIVE SYNC ADAPTER CONTROLLER
  // ===========================================================

  function initGoogleAuth(showPopup = true) {
    const clientId = settingsClientId.value.trim();
    if (!clientId) {
      alert("Please configure a valid Google Client ID first.");
      return;
    }

    // Save client ID to store settings
    store.settings.googleClientId = clientId;
    store.saveSettings();

    try {
      // 1. Initialize google.accounts.oauth2 GIS client
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            // Retrieve simple user profile info if possible via token details
            let email = '';
            try {
              const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
              });
              if (profileResp.ok) {
                const info = await profileResp.json();
                email = info.email;
              }
            } catch (err) {
              console.error("Failed to query profile email details:", err);
            }

            store.setAuth(tokenResponse.access_token, tokenResponse.expires_in, email);
          }
        }
      });

      if (showPopup) {
        // Run interactive login popups consent screen
        tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    } catch (e) {
      console.error("Failed to initialize Google GIS TokenClient:", e);
      store.updateSyncStatus('error', `Initialization error: ${e.message}`);
    }
  }

  // Connect click triggers consent flow
  googleSignInBtn.addEventListener('click', () => {
    initGoogleAuth(true);
  });

  // Disconnect removes credentials
  googleSignOutBtn.addEventListener('click', () => {
    if (confirm("Disconnect Google Drive sync? Your notes will remain saved in this browser but won't be backed up to the cloud anymore.")) {
      store.disconnect();
    }
  });

  // Run app init
  init();
});
