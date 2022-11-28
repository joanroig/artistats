import { Injectable } from '@angular/core';
import { DbId } from '@app/models/db-id.model';
import { Playlist } from '@app/models/playlist.model';
import { Track } from '@app/models/track.model';
import * as localforage from 'localforage';
import { BehaviorSubject, Observable } from 'rxjs';

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

  private analysisPlaylistsChanges = new BehaviorSubject<boolean>(true);
  private editorialPlaylistsChanges = new BehaviorSubject<boolean>(true);
  private editorialTracksChanges = new BehaviorSubject<boolean>(true);

  // Return an observable to notify about database changes
  public getUpdates(dbId: DbId): Observable<boolean> {
    return this.getNotifier(dbId).asObservable();
  }

  get(id: string, dbId: DbId) {
    return this.getStore(dbId).getItem(id);
  }

  async setPlaylist(id: string, playlist: Playlist, dbId: DbId) {
    await this.getStore(dbId).setItem(id, playlist);
    this.getNotifier(dbId).next(true);
  }

  async setTrack(id: string, track: Track, dbId: DbId) {
    await this.getStore(dbId).setItem(id, track);
    this.getNotifier(dbId).next(true);
  }

  delete(id: string, dbId: DbId) {
    return this.getStore(dbId).removeItem(id);
  }

  async getAllKeys(dbId: DbId): Promise<string[]> {
    return this.getStore(dbId).keys();
  }

  async getAllPlaylists(dbId: DbId): Promise<Playlist[]> {
    let all: Playlist[] = [];
    return this.getStore(dbId)
      .iterate((value: Playlist, key: any, iterationNumber: any) => {
        all.push(value as Playlist);
      })
      .then(function () {
        return all;
      })
      .catch(function (err: any) {
        // This code runs if there were any errors
        console.error(err);
        return [];
      });
  }

  async getAllTracks(dbId: DbId): Promise<Track[]> {
    let all: Track[] = [];
    return this.getStore(dbId)
      .iterate((value: Track, key: any, iterationNumber: any) => {
        all.push(value as Track);
      })
      .then(function () {
        return all;
      })
      .catch(function (err: any) {
        // This code runs if there were any errors
        console.error(err);
        return [];
      });
  }

  private getStore(dbId: DbId): LocalForage {
    let store;
    switch (dbId) {
      case DbId.analysis_playlists:
        store = this.analysisPlaylistsStore;
        break;
      case DbId.editorials_playlists:
        store = this.editorialPlaylistsStore;
        break;
      case DbId.editorials_tracks:
        store = this.editorialTracksStore;
        break;
    }
    return store;
  }

  private getNotifier(dbId: DbId): BehaviorSubject<boolean> {
    let notifier;
    switch (dbId) {
      case DbId.analysis_playlists:
        notifier = this.analysisPlaylistsChanges;
        break;
      case DbId.editorials_playlists:
        notifier = this.editorialPlaylistsChanges;
        break;
      case DbId.editorials_tracks:
        notifier = this.editorialTracksChanges;
        break;
    }
    return notifier;
  }
}
