import { Injectable } from '@angular/core';
import {
  ANALYSIS_PLAYLISTS_SORT_ACTIVE,
  ANALYSIS_PLAYLISTS_SORT_DIRECTION,
  ANALYSIS_PLAYLISTS_SORT_REMEMBER,
} from '@app/utils/constants';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {
    this.setDefaults(ANALYSIS_PLAYLISTS_SORT_REMEMBER, true);
    this.setDefaults(ANALYSIS_PLAYLISTS_SORT_ACTIVE, 'position');
    this.setDefaults(ANALYSIS_PLAYLISTS_SORT_DIRECTION, 'asc');
  }

  private setDefaults(key: string, value: any) {
    if (!this.exists(key)) {
      this.setSetting(key, value);
    }
  }

  public exists(key: string): boolean {
    return typeof Storage !== 'undefined' && localStorage.getItem(key) != null;
  }

  public getSetting(key: string): string {
    let res = localStorage.getItem(key);
    return res ? res : '';
  }

  public getBooleanSetting(key: string): boolean {
    if (typeof Storage !== 'undefined' && localStorage.getItem(key)) {
      return localStorage.getItem(key) === 'true';
    }
    return false;
  }

  public setSetting(key: string, value: string) {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
}
