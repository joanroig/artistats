import { Injectable } from '@angular/core';
import { Playlist } from '@app/models/playlist.model';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root',
})
/**
 * IndexedDB wrapper.
 * Documentation: https://github.com/localForage/localForage
 */
export class DatabaseService {
  analysisPlaylistsStore = localforage.createInstance({ name: 'analysis-playlists' });
  editorialPlaylistsStore = localforage.createInstance({ name: 'editorial-playlists' });
  editorialTracksStore = localforage.createInstance({ name: 'editorial-tracks' });

  set(id: string, playlist: Playlist) {
    this.analysisPlaylistsStore.setItem(id, playlist);
  }
}
