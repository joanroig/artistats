export interface Playlist {
  id: string;
  position: number;
  name: string;
  lastFetch: Date;
  author?: string;
  playlistUrl?: string;
  authorUrl?: string;
  followersCount?: number;
  tracks?: SpotifyApi.PlaylistTrackObject[];
  tracksCount?: number;
  lastUpdate?: Date;
  // only used for editorials, position of the track
  trackAddedAt?: Date;
  trackPosition?: number;
}
