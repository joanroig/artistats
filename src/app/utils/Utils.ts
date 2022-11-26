import { ResourceType } from '@app/models/resource-type.model';

export default class Utils {
  static parseSpotifyIds(spotifyStrings: string[], type: ResourceType): { ids: string[]; errors: string[] } {
    let ids: string[] = [];
    let errors: string[] = [];

    // Get IDs from each playlist/track (url, uri or id)
    spotifyStrings.forEach((str) => {
      let id = undefined;
      // Direct ID
      if (str.length === 22) {
        id = str;
      }
      // URI
      else if (str.startsWith(`spotify:${type}:`)) {
        const s = str.split(':')[2];
        if (s.length !== 22) {
          errors.push('Incorrect Spotify URI ' + str);
        } else {
          id = s;
        }
      }
      // URL with or without query params
      else if (str.includes(`open.spotify.com/${type}/`)) {
        let s = str.split(`open.spotify.com/${type}/`)[1];
        if (str.includes('?')) {
          s = s.split('?')[0];
        }
        if (s.length < 22) {
          errors.push('Incorrect Spotify URL ' + str);
        } else {
          id = s.slice(0, 22);
        }
      } else {
        errors.push('Incorrect string ' + str);
      }

      // Add ID if it was found
      if (id) {
        ids.push(id);
      }
    });
    return { ids, errors };
  }
}
