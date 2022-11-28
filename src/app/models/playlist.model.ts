export interface Playlist {
  id: string;
  position?: number;
  name: string;
  lastFetch: Date;
  author?: string;
  playlistUrl?: string;
  authorUrl?: string;
  followersCount?: number;
  tracks?: SpotifyApi.PlaylistTrackObject[];
  tracksCount?: number;
  lastUpdate?: Date;
}
