import { Clipboard } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Playlist } from '@app/models/playlist.model';
import { ResourceType } from '@app/models/resource-type.model';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import Utils from '@app/utils/Utils';

@Component({
  selector: 'app-editorials',
  templateUrl: './editorials.component.html',
  styleUrls: ['./editorials.component.scss'],
})
export class EditorialsComponent implements OnInit {
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
      followers += p.followersCount + '\n';
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

    this.httpClient.get('./assets/editorial-playlists.txt', { responseType: 'text' }).subscribe({
      next: (ids) => {
        // Reset playlist ids
        this.playlistIds = [];

        // Get playlist strings line by line
        let playlistStrings = ids.replace(/\r\n/g, '\n').split('\n');

        // Remove empty strings
        playlistStrings = playlistStrings.filter((n) => n);

        // Get all playlist ids from the strings
        let res = Utils.parseSpotifyIds(playlistStrings, ResourceType.playlist);
        this.playlistIds = res.ids;
        if (res.errors.length > 0) {
          for (let error in res.errors) {
            this.errors += error + '\n';
          }
        }

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
            followersCount: data.followers.total,
            tracksCount: data.tracks.total,
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

  private clearData() {
    this.errors = '';
    this.playlistData.clear();
    this.dataSource = [];
  }
}
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
