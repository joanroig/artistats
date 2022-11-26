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
