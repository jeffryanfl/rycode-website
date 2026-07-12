/**
 * Workbench Store Manager
 * Manages local storage persistence and Google Drive cloud synchronization (App Data Folder).
 * Uses a Last-Write-Wins (LWW) conflict resolution merge algorithm.
 */

export class WorkbenchStore {
  constructor() {
    this.storageKey = 'rycode_workbench_data';
    this.settingsKey = 'rycode_workbench_settings';
    
    this.data = this.loadLocal();
    this.settings = this.loadSettings();
    this.onSyncChange = null; // Callback for sync status updates
  }

  // Load from local storage
  loadLocal() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      } catch (e) {
        console.error("Failed to parse local workbench items:", e);
      }
    }
    return this.getMockItems();
  }

  // Save to local storage
  saveLocal() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      items: this.data,
      updatedAt: Date.now()
    }));
  }

  // Load application settings (Client ID, Sync preferences, tokens)
  loadSettings() {
    const raw = localStorage.getItem(this.settingsKey);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse workbench settings:", e);
      }
    }
    return {
      googleClientId: '',
      googleFileId: '',
      accessToken: '',
      tokenExpiry: 0,
      userEmail: ''
    };
  }

  // Save settings
  saveSettings() {
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
  }

  // Get items
  getItems() {
    return this.data;
  }

  // Save a single note/task item (Create or Update)
  saveItem(itemData) {
    const index = this.data.findIndex(item => item.id === itemData.id);
    const now = Date.now();
    
    const formattedItem = {
      ...itemData,
      updatedAt: now,
      createdAt: itemData.createdAt || now
    };

    if (index > -1) {
      this.data[index] = formattedItem;
    } else {
      this.data.push(formattedItem);
    }
    
    this.saveLocal();
    this.triggerSync();
  }

  // Delete an item
  deleteItem(id) {
    // Soft delete or hard delete? Hard delete is simple, but soft delete is needed to sync deletion.
    // Let's implement soft delete so deleted items are removed from remote too!
    // We add a 'deleted' flag and filter them out in getItems().
    const index = this.data.findIndex(item => item.id === id);
    if (index > -1) {
      this.data[index].deleted = true;
      this.data[index].updatedAt = Date.now();
      this.saveLocal();
      this.triggerSync();
    }
  }

  // Filter out soft-deleted items for the UI
  getActiveItems() {
    return this.data.filter(item => !item.deleted);
  }

  // Merge local list with remote list using Last-Write-Wins (LWW)
  mergeData(remoteItems) {
    if (!Array.isArray(remoteItems)) return;
    
    const mergedMap = new Map();
    
    // Add local items
    this.data.forEach(item => {
      mergedMap.set(item.id, item);
    });

    // Add remote items, resolving conflicts with updatedAt
    remoteItems.forEach(remoteItem => {
      const localItem = mergedMap.get(remoteItem.id);
      if (!localItem || remoteItem.updatedAt > localItem.updatedAt) {
        mergedMap.set(remoteItem.id, remoteItem);
      }
    });

    this.data = Array.from(mergedMap.values());
    this.saveLocal();
  }

  // Google Drive REST API calls
  async triggerSync() {
    if (!this.settings.accessToken || Date.now() > this.settings.tokenExpiry) {
      this.updateSyncStatus('disconnected', 'Google Drive sync not authenticated or expired.');
      return;
    }

    this.updateSyncStatus('syncing', 'Syncing with Google Drive AppData folder...');
    
    try {
      const token = this.settings.accessToken;
      let fileId = this.settings.googleFileId;

      // 1. Locate file if we don't have fileId
      if (!fileId) {
        const listUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name=%27workbench_data.json%27&fields=files(id)';
        const response = await fetch(listUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`Google API returned status ${response.status}`);
        const result = await response.json();
        
        if (result.files && result.files.length > 0) {
          fileId = result.files[0].id;
          this.settings.googleFileId = fileId;
          this.saveSettings();
        }
      }

      // 2. If file exists, read & merge remote data
      if (fileId) {
        const readUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const readResponse = await fetch(readUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (readResponse.ok) {
          const remoteData = await readResponse.json();
          if (remoteData && Array.isArray(remoteData.items)) {
            this.mergeData(remoteData.items);
          }
        } else if (readResponse.status === 404) {
          // File was deleted in Drive, reset ID and create a new one
          fileId = null;
          this.settings.googleFileId = '';
          this.saveSettings();
        } else {
          throw new Error(`Failed to read file: ${readResponse.statusText}`);
        }
      }

      // 3. Write data to Google Drive
      const payload = JSON.stringify({
        items: this.data,
        updatedAt: Date.now()
      });

      if (!fileId) {
        // Create new file in AppData folder
        const createMetadataUrl = 'https://www.googleapis.com/drive/v3/files';
        const createMetaResponse = await fetch(createMetadataUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'workbench_data.json',
            parents: ['appDataFolder']
          })
        });

        if (!createMetaResponse.ok) throw new Error(`Failed to create file metadata: ${createMetaResponse.statusText}`);
        const fileMetadata = await createMetaResponse.json();
        fileId = fileMetadata.id;
        this.settings.googleFileId = fileId;
        this.saveSettings();
      }

      // Upload/patch content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      if (!uploadResponse.ok) throw new Error(`Failed to upload media content: ${uploadResponse.statusText}`);
      
      this.updateSyncStatus('synced', `Last sync: ${new Date().toLocaleTimeString()}`);
      
      // Dispatch a store-updated event so the UI updates
      window.dispatchEvent(new CustomEvent('workbench-store-updated'));

    } catch (error) {
      console.error("Workbench Sync Error:", error);
      this.updateSyncStatus('error', `Sync error: ${error.message}`);
    }
  }

  // Update sync status indicator helper
  updateSyncStatus(status, message) {
    if (this.onSyncChange) {
      this.onSyncChange(status, message);
    }
    // Also save simple state for startup UI checks
    this.syncStatus = { status, message };
  }

  // Log in user and trigger flow
  setAuth(accessToken, expiresInSeconds, userEmail) {
    this.settings.accessToken = accessToken;
    this.settings.tokenExpiry = Date.now() + (expiresInSeconds * 1000);
    if (userEmail) this.settings.userEmail = userEmail;
    this.saveSettings();
    this.triggerSync();
  }

  // Log out user
  disconnect() {
    this.settings.accessToken = '';
    this.settings.tokenExpiry = 0;
    this.settings.googleFileId = '';
    this.settings.userEmail = '';
    this.saveSettings();
    this.updateSyncStatus('disconnected', 'Disconnected from Google Drive.');
    window.dispatchEvent(new CustomEvent('workbench-store-updated'));
  }

  // Mock initial items to look nice
  getMockItems() {
    const now = Date.now();
    return [
      {
        id: 'mock-1',
        title: '💡 Welcome to your Lab Workbench',
        type: 'note',
        content: 'This is a premium, fully local-first workspace for taking notes and organizing workflows. You can customize the look, search across categories, and connect Google Drive for instant cloud backups.\n\nUse the sidebar to explore and search notes, or filter by tags like #work, #ideas, or #tasks.',
        status: 'inbox',
        priority: 'medium',
        tags: ['guide', 'workbench'],
        pinned: true,
        color: '#eff6ff',
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2
      },
      {
        id: 'mock-2',
        title: '📋 Task Tracker Guide',
        type: 'task',
        content: 'Checklist items can be checked directly on the cards, updating the task progress bars in real-time!',
        status: 'todo',
        priority: 'high',
        tags: ['tasks'],
        pinned: false,
        color: '#fffbeb',
        checklist: [
          { text: 'Create a new note using Cmd+K command bar', checked: false },
          { text: 'Toggle layout styles to List view mode', checked: false },
          { text: 'Configure Google Drive backup sync in settings', checked: false }
        ],
        createdAt: now - 3600000,
        updatedAt: now - 3600000
      }
    ];
  }
}
