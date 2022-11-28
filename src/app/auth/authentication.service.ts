import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import { environment } from '@env/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface LoginContext {
  username: string;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 * Documentation: https://www.newline.co/courses/build-a-spotify-connected-app/implementing-the-authorization-code-flow
 */
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private loginStatus = new BehaviorSubject<boolean>(false);
  private userData = new BehaviorSubject<object>({});

  constructor(private httpClient: HttpClient, private spotifyService: SpotifyService) {
    // // logout if the spotify session is closed
    // spotifyService.getLoginStatusUpdate().subscribe((loginStatus) => {
    //   if (!loginStatus) {
    //     this.logout();
    //   }
    // });
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
  public getLoginStatusUpdate() {
    return this.loginStatus.asObservable();
  }

  // Return an observable to notify about user data changes
  public getUserDataUpdate() {
    return this.userData.asObservable();
  }

  // Save the token to be used in subsequent requests
  setToken(token: string) {
    // console.warn(token);
    this.spotifyService.token = token;
    this.spotifyService.spotifyApi.setAccessToken(token);
    this.loginStatus.next(true);
  }

  // Save the token to be used in subsequent requests
  setUserData() {
    this.httpClient
      .get('https://api.spotify.com/v1/me', {
        headers: { Authorization: 'Bearer ' + this.spotifyService.token },
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

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(): Promise<boolean> {
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

    return new Promise<boolean>((resolve, reject) => {
      //This event listener will trigger once your callback page adds the token to localStorage
      window.addEventListener('storage', (event) => {
        if (event.key == 'accessToken') {
          const token = event.newValue;
          if (token) {
            this.setToken(token);
            this.setUserData(); // needs to wait?

            resolve(true);
          }
        }
      });
    });
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    // Remove the access token of the current user

    localStorage.removeItem('accessToken');
    this.loginStatus.next(false);
    // Customize credentials invalidation here
    // this.credentialsService.setCredentials();
    // this.spotifyService.logout();
    return of(true);
  }
}
