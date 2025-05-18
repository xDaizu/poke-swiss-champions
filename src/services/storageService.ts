import { Participant, Tournament } from '../types';

// Storage keys
const KEYS = {
  PARTICIPANTS: 'poke-swiss-champions:participants',
  TOURNAMENT: 'poke-swiss-champions:tournament',
  BACKUP_PARTICIPANTS: 'poke-swiss-champions:participants-backup',
  BACKUP_TOURNAMENT: 'poke-swiss-champions:tournament-backup',
  LAST_BACKUP: 'poke-swiss-champions:last-backup'
};

// Maximum backup versions to keep
const MAX_BACKUPS = 3;

/**
 * Check if localStorage is available and working
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return result === testKey;
  } catch (e) {
    return false;
  }
};

/**
 * Check if there's enough storage space left
 * @param dataSize Size of data to store in bytes
 */
const hasEnoughStorageSpace = (dataSize: number): boolean => {
  try {
    // Check available space using a technique that estimates quota
    const testKey = '__quota_test__';
    let testData = '1';
    let quotaExceeded = false;
    
    // Try to add more and more data until quota is exceeded
    try {
      while (!quotaExceeded) {
        localStorage.setItem(testKey, testData);
        testData += testData; // Double the data size
        
        // Safety check to prevent browser freezing
        if (testData.length > 10000000) { // 10MB
          break;
        }
      }
    } catch (e) {
      quotaExceeded = true;
    }
    
    // Clean up
    localStorage.removeItem(testKey);
    
    // If we can store more than the requested size, we have enough space
    return testData.length > dataSize;
  } catch (e) {
    return false;
  }
};

/**
 * Storage service with backup functionality for tournament data
 */
export const storageService = {
  /**
   * Save data to localStorage with backup
   */
  saveParticipants(participants: Participant[]): void {
    try {
      // First check if localStorage is available
      if (!isLocalStorageAvailable()) {
        throw new Error('localStorage is not available');
      }
      
      // Check if we have enough storage space
      const dataStr = JSON.stringify(participants);
      if (!hasEnoughStorageSpace(dataStr.length)) {
        throw new Error('Not enough storage space');
      }
      
      // First backup existing data if available
      this.createBackup();
      
      // Save new data
      localStorage.setItem(KEYS.PARTICIPANTS, dataStr);
    } catch (error) {
      console.error('Error saving participants:', error);
      // Attempt more aggressive cleanup when space is an issue
      if (error instanceof Error && error.message === 'Not enough storage space') {
        this.pruneOldBackups(KEYS.BACKUP_PARTICIPANTS, 1); // Keep only 1 backup
        try {
          // Try again
          const dataStr = JSON.stringify(participants);
          localStorage.setItem(KEYS.PARTICIPANTS, dataStr);
        } catch (retryError) {
          console.error('Error saving participants after cleanup:', retryError);
        }
      }
    }
  },

  /**
   * Save tournament data to localStorage with backup
   */
  saveTournament(tournament: Tournament): void {
    try {
      // First check if localStorage is available
      if (!isLocalStorageAvailable()) {
        throw new Error('localStorage is not available');
      }
      
      // Check if we have enough storage space
      const dataStr = JSON.stringify(tournament);
      if (!hasEnoughStorageSpace(dataStr.length)) {
        throw new Error('Not enough storage space');
      }
      
      // First backup existing data if available
      this.createBackup();
      
      // Save new data
      localStorage.setItem(KEYS.TOURNAMENT, dataStr);
    } catch (error) {
      console.error('Error saving tournament data:', error);
      // Attempt more aggressive cleanup when space is an issue
      if (error instanceof Error && error.message === 'Not enough storage space') {
        this.pruneOldBackups(KEYS.BACKUP_TOURNAMENT, 1); // Keep only 1 backup
        try {
          // Try again
          const dataStr = JSON.stringify(tournament);
          localStorage.setItem(KEYS.TOURNAMENT, dataStr);
        } catch (retryError) {
          console.error('Error saving tournament data after cleanup:', retryError);
        }
      }
    }
  },

  /**
   * Load participants from localStorage, with fallback to backup if needed
   */
  loadParticipants(): Participant[] {
    try {
      const data = localStorage.getItem(KEYS.PARTICIPANTS);
      if (data) {
        return JSON.parse(data);
      }
      
      // If no data or parsing error, try loading from backup
      const backup = this.loadFromBackup(KEYS.BACKUP_PARTICIPANTS);
      return backup as Participant[] || [];
    } catch (error) {
      console.error('Error loading participants, trying backup:', error);
      const backup = this.loadFromBackup(KEYS.BACKUP_PARTICIPANTS);
      return backup as Participant[] || [];
    }
  },

  /**
   * Load tournament data from localStorage, with fallback to backup if needed
   */
  loadTournament(): Tournament {
    const defaultTournament: Tournament = {
      rounds: 4,
      currentRound: 0,
      matches: []
    };
    
    try {
      const data = localStorage.getItem(KEYS.TOURNAMENT);
      if (data) {
        return JSON.parse(data);
      }
      
      // If no data or parsing error, try loading from backup
      const backup = this.loadFromBackup(KEYS.BACKUP_TOURNAMENT);
      return backup as Tournament || defaultTournament;
    } catch (error) {
      console.error('Error loading tournament data, trying backup:', error);
      const backup = this.loadFromBackup(KEYS.BACKUP_TOURNAMENT);
      return backup as Tournament || defaultTournament;
    }
  },

  /**
   * Create a backup of current data
   */
  createBackup(): void {
    try {
      const participants = localStorage.getItem(KEYS.PARTICIPANTS);
      const tournament = localStorage.getItem(KEYS.TOURNAMENT);
      
      if (participants) {
        // Store with timestamp suffix for versioning
        const timestamp = Date.now();
        const backupKey = `${KEYS.BACKUP_PARTICIPANTS}-${timestamp}`;
        localStorage.setItem(backupKey, participants);
        this.pruneOldBackups(KEYS.BACKUP_PARTICIPANTS, MAX_BACKUPS);
      }
      
      if (tournament) {
        // Store with timestamp suffix for versioning
        const timestamp = Date.now();
        const backupKey = `${KEYS.BACKUP_TOURNAMENT}-${timestamp}`;
        localStorage.setItem(backupKey, tournament);
        this.pruneOldBackups(KEYS.BACKUP_TOURNAMENT, MAX_BACKUPS);
      }
      
      localStorage.setItem(KEYS.LAST_BACKUP, Date.now().toString());
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  },

  /**
   * Load data from the most recent backup
   */
  loadFromBackup(keyPrefix: string): unknown {
    try {
      // Get all backup keys sorted by timestamp (newest first)
      const backupKeys = this.getBackupKeys(keyPrefix).sort().reverse();
      
      // Try loading from backups in order
      for (const key of backupKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            // If parsing fails, try next backup
            continue;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading from backup:', error);
      return null;
    }
  },

  /**
   * Get all backup keys with the given prefix
   */
  getBackupKeys(keyPrefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(keyPrefix)) {
        keys.push(key);
      }
    }
    return keys;
  },

  /**
   * Remove old backups, keeping only the most recent ones
   */
  pruneOldBackups(keyPrefix: string, keepCount: number = MAX_BACKUPS): void {
    const keys = this.getBackupKeys(keyPrefix).sort();
    
    // Remove oldest backups if we have more than keepCount
    if (keys.length > keepCount) {
      const keysToRemove = keys.slice(0, keys.length - keepCount);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  },

  /**
   * Force a restore from the most recent backup
   */
  restoreFromBackup(): boolean {
    try {
      const participants = this.loadFromBackup(KEYS.BACKUP_PARTICIPANTS) as Participant[] | null;
      const tournament = this.loadFromBackup(KEYS.BACKUP_TOURNAMENT) as Tournament | null;
      
      if (participants) {
        localStorage.setItem(KEYS.PARTICIPANTS, JSON.stringify(participants));
      }
      
      if (tournament) {
        localStorage.setItem(KEYS.TOURNAMENT, JSON.stringify(tournament));
      }
      
      return !!(participants || tournament);
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  },

  /**
   * Get last backup time
   */
  getLastBackupTime(): Date | null {
    const timestamp = localStorage.getItem(KEYS.LAST_BACKUP);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }
}; 