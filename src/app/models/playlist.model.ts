export interface Playlist {
  num: number;
  id: string;
  name: string;
  author?: string;
  playlistUrl?: string;
  authorUrl?: string;
  followersCount?: number;
  tracksCount?: number;
  lastUpdate?: Date;
}
