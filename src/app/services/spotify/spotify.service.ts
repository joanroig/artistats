import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { Playlist } from '@app/models/playlist.model';
import { Track } from '@app/models/track.model';
import { Subject } from 'rxjs';
import SpotifyWebApi from 'spotify-web-api-js';
import { DatabaseService } from '../database/database.service';

@Injectable({
  providedIn: 'root',
})
/**
 * Spotify API wrapper.
 * Documentation: https://github.com/jmperez/spotify-web-api-js
 */
export class SpotifyService {
  public spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  public token?: string | null;
  private throttleMillis = 25;
  private stop = false;

  private fetchLogNotifier = new Subject<string>();
  private errorLogNotifier = new Subject<string>();

  constructor(private databaseService: DatabaseService, private snackBar: MatSnackBar) {
    this.spotifyApi = new SpotifyWebApi();
  }

  // Return an observable to notify about fetching status
  public getFetchLogUpdates() {
    return this.fetchLogNotifier.asObservable();
  }

  // Return an observable to notify about fetching status
  public getFetchErrorUpdates() {
    return this.errorLogNotifier.asObservable();
  }

  stopUpdate() {
    this.stop = true;
  }

  private appendErrorLog(log: string) {
    this.errorLogNotifier.next(log);
  }

  async fetchTracks(trackIds: string[], dbId: DbId): Promise<{ updateCount: number; failed: string[] }> {
    console.debug('fetchTracks');
    this.stop = false;
    let failed = [];
    let updateCount = 0;
    let index = 0;

    for (const id of trackIds) {
      // Stop if requested
      if (this.stop) {
        this.stop = false;
        // this.isLoading = false;
        this.appendErrorLog('> Stopped');
        for (let i = index; i < trackIds.length; i++) {
          let skipped = trackIds[i];
          this.appendErrorLog('Skipped ' + skipped);
          failed.push(skipped);
        }
        break;
      }

      index++;

      let prevTrack = (await this.databaseService.get(id, dbId)) as Track;

      // Print step
      this.fetchLogNotifier.next(`Processing ${index} of  ${trackIds.length} : ${id}`);

      // Skip if already processed
      if (prevTrack) {
        this.appendErrorLog('Skipped repeated track ' + id);
        // No need to add to the withError objects as the track is already processed
        continue;
      }

      // Fetch data
      await this.spotifyApi.getTrack(id).then(
        async (data) => {
          // Get size to set the position
          let count = (await this.databaseService.getCount(dbId)) + 1;

          let track: Track = { ...data, position: count, featuredOn: [] };
          await this.databaseService.setTrack(id, track, dbId);
          updateCount++;
        },
        (error: any) => {
          this.appendErrorLog('Problem fetching track ' + id + ' - ' + error.status);
          failed.push(id);
          if (error.status === 401) {
            if (error.status === 401) {
              this.snackBar.open('Token expired, go to user menu and press "Refresh token"', 'OK', {
                duration: 5000,
              });
            }
          }
        }
      );

      // Throttle fetch
      await this.delay(this.throttleMillis);
    }

    this.fetchLogNotifier.next('');
    return { updateCount, failed };
  }

  // Get playlist details
  async fetchPlaylists(playlistIds: string[], mode: ModeType, dbId: DbId) {
    console.debug('fetchPlaylists');
    this.stop = false;
    let failed = [];
    let updateCount = 0;
    let index = 0;

    for (const id of playlistIds) {
      // Stop if requested
      if (this.stop) {
        this.stop = false;
        // this.isLoading = false;
        this.appendErrorLog('> Stopped');
        for (let i = index; i < playlistIds.length; i++) {
          let skipped = playlistIds[i];
          this.appendErrorLog('Skipped ' + skipped);
          failed.push(skipped);
        }
        break;
      }

      index++;

      let prevPlaylist = (await this.databaseService.get(id, dbId)) as Playlist;

      // Print step
      switch (mode) {
        case ModeType.new:
          this.fetchLogNotifier.next(`Processing ${index} of  ${playlistIds.length} : ${id}`);
          break;

        case ModeType.update:
          if (prevPlaylist) {
            this.fetchLogNotifier.next(
              `Updating ${index} of  ${playlistIds.length} : "${prevPlaylist.name}" by ${prevPlaylist.author}`
            );
          } else {
            this.appendErrorLog('[insertPlaylists] Database inconsistency! Check with the admin the id: ' + id);
          }
          break;

        default:
          break;
      }

      if (mode === ModeType.new) {
        // Skip if already processed
        if (prevPlaylist) {
          this.appendErrorLog('Skipped repeated playlist ' + id);
          // No need to add to the withError objects as the playlist is already processed
          continue;
        }
      }

      // Fetch data
      await this.spotifyApi.getPlaylist(id).then(
        async (data) => {
          let tracks = data.tracks.items;

          // Get the rest of the tracks if needed
          if (data.tracks.next) {
            let offset = data.tracks.offset;
            let limit = 50;
            let morePages = true;
            while (morePages) {
              // Throttle fetch
              await this.delay(this.throttleMillis);
              await this.getPlaylistPage(id, offset, limit).then(
                (pageData) => {
                  offset += limit;
                  tracks = tracks.concat(pageData.items);
                  if (!pageData.next) {
                    morePages = false;
                  }
                },
                (error) => {
                  this.appendErrorLog('Problem fetching playlist ' + id + ' - ' + error.status);
                  morePages = false;
                  failed.push(id);
                }
              );
            }
          }

          // Calculate playlist last update
          let lastUpdate = new Date('1970-05-05T01:01:01Z');
          tracks.forEach((track) => {
            const d = new Date(track.added_at);
            if (d > lastUpdate) {
              lastUpdate = d;
            }
          });

          // Get size to set the position
          let count = await this.databaseService.getCount(dbId);

          const playlist: Playlist = {
            id,
            position: prevPlaylist?.position || count, // set at same position if it's an update
            name: data.name,
            lastFetch: new Date(),
            author: data.owner.display_name,
            playlistUrl: data.external_urls.spotify,
            authorUrl: data.owner.external_urls.spotify,
            followersCount: data.followers.total,
            tracksCount: data.tracks.total,
            lastUpdate,
          };

          // Add all track data
          if (dbId === DbId.editorials_playlists) {
            playlist.tracks = tracks;
          }

          await this.databaseService.setPlaylist(id, playlist, dbId);
          updateCount++;
        },
        (error: any) => {
          this.appendErrorLog('Problem fetching playlist ' + id + ' - ' + error.status);
          failed.push(id);
          if (error.status === 401) {
            this.snackBar.open('Token expired, go to user menu and press "Refresh token"', 'OK', {
              duration: 5000,
            });
            this.stop = true;
          }
        }
      );

      // Throttle fetch
      await this.delay(this.throttleMillis);
    }

    this.fetchLogNotifier.next('');
    return { updateCount, failed };
  }

  // Get playlist tracks page
  async getPlaylistPage(id: string, offset: number, limit: number) {
    return this.spotifyApi.getPlaylistTracks(id, { offset, limit });
  }

  delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
}
