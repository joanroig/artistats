import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpotifyService } from '@app/services/spotify/spotify.service';

export interface Playlist {
  num: number;
  id: string;
  name: string;
  author?: string;
  playlistUrl?: string;
  authorUrl?: string;
  followers?: number;
  tracks?: number;
  lastUpdate?: Date;
}

@Component({
  selector: 'app-playlist-analysis',
  templateUrl: './playlist-analysis.component.html',
  styleUrls: ['./playlist-analysis.component.scss'],
})
export class PlaylistAnalysisComponent implements OnInit {
  throttleMillis = 25;

  // Load controls
  startupLoaded = false;
  loading = false;
  stop = false;

  loginStatus?: boolean;
  userData?: any;
  errors = '';

  playlistIds: string[] = [];

  playlistData: Map<string, Playlist> = new Map<string, Playlist>();

  displayedColumns: string[] = ['num', 'name', 'author', 'followers', 'tracks', 'lastUpdate'];
  dataSource: Playlist[] = [];

  constructor(
    private httpClient: HttpClient,
    private spotifyService: SpotifyService,
    private clipboard: Clipboard,
    private datepipe: DatePipe,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.info('starting analysis');
    this.spotifyService.loginStatusUpdate().subscribe((loginStatus) => {
      this.loginStatus = loginStatus;
      // First load after detecting a login
      if (loginStatus === true && this.startupLoaded === false) {
        this.startupLoaded = true;
        setTimeout(() => {
          this.updatePlaylists();
        }, 300);
      }
    });

    // Get all user data updates
    this.spotifyService.userDataUpdate().subscribe((userData) => {
      this.userData = userData;
    });

    // Start the Spotify service
    this.spotifyService.init();
  }

  login() {
    this.spotifyService.login();
  }

  logout() {
    this.clearData();
    this.stopUpdate();
    this.startupLoaded = false;
    this.spotifyService.logout();
  }

  copyDates() {
    let dates = '';
    Array.from(this.playlistData.values()).forEach((p) => {
      dates += this.datepipe.transform(p.lastUpdate, 'dd/MM/yyyy') + '\n';
    });
    this.clipboard.copy(dates);
    this.snackBar.open('Dates copied to the clipboard!', 'Close', {
      duration: 1000,
    });
  }

  copyFollowers() {
    let followers = '';
    Array.from(this.playlistData.values()).forEach((p) => {
      followers += p.followers + '\n';
    });
    this.clipboard.copy(followers);
    this.snackBar.open('Followers copied to the clipboard!', 'Close', {
      duration: 1000,
    });
  }

  stopUpdate() {
    this.stop = true;
  }

  async updatePlaylists() {
    this.clearData();

    this.httpClient.get('./assets/playlists.txt', { responseType: 'text' }).subscribe({
      next: (ids) => {
        // Reset playlist ids
        this.playlistIds = [];

        // Get playlist strings line by line
        let playlistStrings = ids.replace(/\r\n/g, '\n').split('\n');

        // Remove empty strings
        playlistStrings = playlistStrings.filter((n) => n);

        // Get all playlist ids from the strings
        this.playlistIds = this.parseSpotifyIds(playlistStrings);

        // Get data of all playlists
        this.getPlaylistData();
      },
      error: (e) => console.error(e),
    });
  }

  private async getPlaylistData() {
    this.loading = true;

    console.info('Number of playlists to process: ' + this.playlistIds.length);

    let count = 1;
    for (const id of this.playlistIds) {
      // Stop if requested
      if (this.stop) {
        this.stop = false;
        this.loading = false;
        console.error('Stopped by the user');
        this.errors += 'Stopped by the user' + '\n';
        break;
      }

      // Skip if already processed
      if (this.playlistData.has(id)) {
        console.error('Repeated playlist ' + id);
        this.errors += 'Repeated playlist ' + id + '\n';
        continue;
      }

      // Fetch data
      await this.spotifyService.getPlaylistData(id).then(
        async (data) => {
          let tracks = data.tracks.items;

          // Get the rest of the tracks if needed
          if (data.tracks.next) {
            let offset = data.tracks.offset;
            let limit = 50;
            let morePages = true;
            while (morePages) {
              // Throttle fetch
              await delay(this.throttleMillis);
              await this.spotifyService.getPlaylistPage(id, offset, limit).then(
                (pageData) => {
                  offset += limit;
                  tracks = tracks.concat(pageData.items);
                  if (!pageData.next) {
                    morePages = false;
                  }
                },
                (error) => {
                  console.error('Problem fetching playlist ' + id + ' - ' + error.status);
                  this.errors += 'Problem fetching playlist ' + id + ' - ' + error.status + '\n';
                  morePages = false;
                }
              );
            }
          }

          // Calculate playlist last update
          let lastUpdate = new Date('1970-01-01T01:01:01Z');
          tracks.forEach((track) => {
            const d = new Date(track.added_at);
            if (d > lastUpdate) {
              lastUpdate = d;
            }
          });

          const playlist: Playlist = {
            num: count,
            id,
            name: data.name,
            author: data.owner.display_name,
            playlistUrl: data.external_urls.spotify,
            authorUrl: data.owner.external_urls.spotify,
            followers: data.followers.total,
            tracks: data.tracks.total,
            lastUpdate,
          };
          this.playlistData.set(id, playlist);
          count++;
        },
        (error) => {
          console.error('Problem fetching playlist ' + id + ' - ' + error.status);
          this.errors += 'Problem fetching playlist ' + id + ' - ' + error.status + '\n';
        }
      );

      // Throttle fetch
      await delay(this.throttleMillis);

      this.dataSource = Array.from(this.playlistData.values());
    }

    this.loading = false;
  }

  private parseSpotifyIds(playlistStrings: string[]): string[] {
    let ids: string[] = [];
    // Get IDs from each playlist (url, uri or id)
    playlistStrings.forEach((str) => {
      let id = undefined;

      // Direct ID
      if (str.length === 22) {
        id = str;
      }
      // URI
      else if (str.startsWith('spotify:playlist:')) {
        const s = str.split(':')[2];
        if (s.length !== 22) {
          console.error('Incorrect Spotify URI ' + str);
          this.errors += 'Incorrect Spotify URI ' + str + '\n';
        } else {
          id = s;
        }
      }
      // URL with or without query params
      else if (str.includes('open.spotify.com/playlist/')) {
        let s = str.split('open.spotify.com/playlist/')[1];
        if (str.includes('?')) {
          s = s.split('?')[0];
        }
        if (s.length < 22) {
          console.error('Incorrect Spotify URL ' + str);
          this.errors += 'Incorrect Spotify URL ' + str + '\n';
        } else {
          id = s.slice(0, 22);
        }
      } else {
        console.error('Incorrect playlist string ' + str);
        this.errors += 'Incorrect playlist string ' + str + '\n';
      }

      // Add ID if it was found
      if (id) {
        ids.push(id);
      }
    });
    return ids;
  }

  private clearData() {
    this.errors = '';
    this.playlistData.clear();
    this.dataSource = [];
  }
}
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
