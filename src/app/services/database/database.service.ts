import { Injectable } from '@angular/core';
import { DbId } from '@app/models/db-id.model';
import { Playlist } from '@app/models/playlist.model';
import { Track } from '@app/models/track.model';
import * as localforage from 'localforage';
import { Observable, Subject } from 'rxjs';

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

  private analysisPlaylistsChanges = new Subject<boolean>();
  private editorialPlaylistsChanges = new Subject<boolean>();
  private editorialTracksChanges = new Subject<boolean>();

  /**
   * Return an observable to notify about database changes
   * @param dbId database id to subscribe to
   * @returns true value to indicate there are changes, the data needs to be retrieved manually
   */
  public getUpdates(dbId: DbId): Observable<boolean> {
    return this.getNotifier(dbId).asObservable();
  }

  get(id: string, dbId: DbId) {
    return this.getStore(dbId).getItem(id);
  }

  async setPlaylist(id: string, playlist: Playlist, dbId: DbId) {
    await this.getStore(dbId).setItem(id, playlist);
    console.debug('setPlaylist');
    this.getNotifier(dbId).next(true);
  }

  async setTrack(id: string, track: Track, dbId: DbId) {
    await this.getStore(dbId).setItem(id, track);
    console.debug('setTrack');
    this.getNotifier(dbId).next(true);
  }

  async delete(id: string, dbId: DbId) {
    await this.getStore(dbId).removeItem(id);
    console.debug('delete');
    this.getNotifier(dbId).next(true);
  }

  async clearDb(dbId: DbId) {
    await this.getStore(dbId).clear();
    console.debug('clearDb');
  }

  async getCount(dbId: DbId): Promise<number> {
    return this.getStore(dbId).length();
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

  private getNotifier(dbId: DbId): Subject<boolean> {
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
