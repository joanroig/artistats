import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Subject } from 'rxjs';
import SpotifyWebApi from 'spotify-web-api-js';

@Injectable({
  providedIn: 'root',
})
/**
 * Spotify API wrapper.
 * Documentation: https://github.com/jmperez/spotify-web-api-js
 */
export class SpotifyService {
  private spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  private token?: string | null;

  private loginStatus = new Subject<boolean>();
  private userData = new Subject<object>();

  constructor(private httpClient: HttpClient) {
    this.spotifyApi = new SpotifyWebApi();
  }

  // Initialize the API connection
  init() {
    const previousToken = localStorage.getItem('accessToken');
    if (typeof previousToken === 'string' && previousToken.length !== 0) {
      this.setToken(previousToken);
      this.setUserData();
    } else {
      console.error('No previous token available');
      this.logout();
    }
  }

  // Return an observable to notify about the login status
  public loginStatusUpdate() {
    return this.loginStatus.asObservable();
  }

  // Return an observable to notify about user data changes
  public userDataUpdate() {
    return this.userData.asObservable();
  }

  // Remove the access token of the current user
  public logout() {
    localStorage.removeItem('accessToken');
    this.loginStatus.next(false);
  }

  // Login procedure
  public login() {
    const spotifyClientId = environment.SPOTIFY_CLIENT_ID;
    const spotifyRedirectUri = 'https://localhost:4200/redirect';
    const spotifyScope = 'playlist-read-private';
    const spotifyAuthEndpoint =
      'https://accounts.spotify.com/authorize?' +
      'client_id=' +
      spotifyClientId +
      '&redirect_uri=' +
      spotifyRedirectUri +
      '&scope=' +
      spotifyScope +
      '&response_type=token&state=123';

    // Open login window
    window.open(spotifyAuthEndpoint, 'callBackWindow', 'height=500,width=400');

    //This event listener will trigger once your callback page adds the token to localStorage
    window.addEventListener('storage', (event) => {
      if (event.key == 'accessToken') {
        const token = event.newValue;
        if (token) {
          this.setToken(token);
          this.setUserData();
        }
      }
    });
  }

  // Save the token to be used in subsequent requests
  setToken(token: string) {
    // console.warn(token);
    this.token = token;
    this.spotifyApi.setAccessToken(token);
    this.loginStatus.next(true);
  }

  // Save the token to be used in subsequent requests
  setUserData() {
    this.httpClient
      .get('https://api.spotify.com/v1/me', {
        headers: { Authorization: 'Bearer ' + this.token },
      })
      .subscribe({
        next: (user) => {
          this.userData.next(user);
          this.loginStatus.next(true);
        },
        error: (e) => {
          console.error('Token expired ' + e);
          this.loginStatus.next(false);
        },
      });
  }

  // Get playlist details
  async getPlaylistData(id: string) {
    return this.spotifyApi.getPlaylist(id);
  }

  // Get playlist tracks page
  async getPlaylistPage(id: string, offset: number, limit: number) {
    return this.spotifyApi.getPlaylistTracks(id, { offset, limit });
  }
}
