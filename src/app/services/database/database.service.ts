import { Injectable } from '@angular/core';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root',
})
/**
 * IndexedDB wrapper.
 * Documentation: https://github.com/localForage/localForage
 */
export class DatabaseService {
  store = localforage.createInstance({
    name: 'artistats',
  });

  constructor() {
    // this.store.getItem('analysis-playlists');
    this.store.setItem('analysis-playlists', {});
    this.store.setItem('editorial-playlists', {});
    this.store.setItem('editorial-tracks', {});
  }
}
