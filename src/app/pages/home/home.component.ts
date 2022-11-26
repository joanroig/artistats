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
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
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

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.spotifyService.loginStatusUpdate().subscribe((loginStatus) => {
      this.loginStatus = loginStatus;
    });

    // Get all user data updates
    this.spotifyService.userDataUpdate().subscribe((userData) => {
      this.userData = userData;
    });

    // Start the Spotify service
    this.spotifyService.init();
  }
}
