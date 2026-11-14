import { ScanResult } from '../types/crop';

const STORAGE_KEY = 'agrosan_offline_scans_v1';
const SETTINGS_KEY = 'agrosan_user_settings_v1';

export interface UserSettings {
  language: 'ar' | 'en';
  autoSpeakDiagnosis: boolean;
  farmName?: string;
  defaultCropId?: string;
}

export function getOfflineScans(): ScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading offline scans:', e);
    return [];
  }
}

export function saveOfflineScan(scan: ScanResult): void {
  try {
    const scans = getOfflineScans();
    // Prepend to show latest first, limit to 50 for storage quota
    const updated = [scan, ...scans.filter(s => s.id !== scan.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving scan offline:', e);
  }
}

export function deleteOfflineScan(id: string): void {
  try {
    const scans = getOfflineScans();
    const updated = scans.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting scan:', e);
  }
}

export function updateScanNotes(id: string, notes: string, resolved?: boolean): void {
  try {
    const scans = getOfflineScans();
    const updated = scans.map(s => {
      if (s.id === id) {
        return {
          ...s,
          userNotes: notes,
          resolved: resolved !== undefined ? resolved : s.resolved
        };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating scan notes:', e);
  }
}

export function clearAllScans(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        language: 'ar',
        autoSpeakDiagnosis: false,
        farmName: 'مزرعتي الحقلية',
        defaultCropId: 'auto'
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      language: 'ar',
      autoSpeakDiagnosis: false,
      farmName: 'مزرعتي الحقلية',
      defaultCropId: 'auto'
    };
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): void {
  try {
    const current = getUserSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}
