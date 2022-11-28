import { Playlist } from './playlist.model';

export interface Track extends SpotifyApi.SingleTrackResponse {
  position?: number;
  // playlist ids where the track is featured
  featuredOn: Playlist[];
}
