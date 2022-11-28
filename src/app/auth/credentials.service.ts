import { Injectable } from '@angular/core';

export interface Credentials {
  // Customize received credentials here
  username: string;
}

const credentialsKey = 'accessToken';

/**
 * Provides storage for authentication credentials.
 * The Credentials interface should be replaced with proper implementation.
 */
@Injectable({
  providedIn: 'root',
})
export class CredentialsService {
  private _credentials: String | null = null;

  constructor() {}

  /**
   * Checks is the user is authenticated.
   * @return True if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  /**
   * Gets the user credentials.
   * @return The user credentials or null if the user is not authenticated.
   */
  get credentials(): String | null {
    const savedCredentials = sessionStorage.getItem(credentialsKey) || localStorage.getItem(credentialsKey);
    if (savedCredentials) {
      this._credentials = savedCredentials;
    }
    return this._credentials;
  }

  /**
   * Sets the user credentials.
   * The credentials may be persisted across sessions by setting the `remember` parameter to true.
   * Otherwise, the credentials are only persisted for the current session.
   * @param credentials The user credentials.
   * @param remember True to remember credentials across sessions.
   */
  // setCredentials(credentials?: String, remember?: boolean) {
  //   this._credentials = credentials || null;

  //   if (credentials) {
  //     const storage = remember ? localStorage : sessionStorage;
  //     storage.setItem(credentialsKey, JSON.stringify(credentials));
  //   } else {
  //     sessionStorage.removeItem(credentialsKey);
  //     localStorage.removeItem(credentialsKey);
  //   }
  // }
}
