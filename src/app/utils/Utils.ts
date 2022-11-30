import { ResourceType } from '@app/models/resource-type.model';
import * as moment from 'moment';

export default class Utils {
  static now() {
    return moment().format('DD-MM-YYYY');
  }

  static isValidDate(date: Date) {
    if (date.getFullYear() > 1980) {
      return true;
    }
    return false;
  }

  static parseSpotifyIds(
    spotifyStrings: string[],
    type: ResourceType
  ): { ids: string[]; errorLines: string[]; errorLog: string[] } {
    let ids: string[] = [];
    let errorLines: string[] = [];
    let errorLog: string[] = [];

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
          errorLog.push('Incorrect Spotify URI ' + str);
          errorLines.push(str);
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
          errorLog.push('Incorrect Spotify URL ' + str);
          errorLines.push(str);
        } else {
          id = s.slice(0, 22);
        }
      } else {
        errorLog.push('Incorrect string ' + str);
        errorLines.push(str);
      }

      // Add ID if it was found
      if (id) {
        ids.push(id);
      }
    });
    return { ids, errorLines, errorLog };
  }
}
