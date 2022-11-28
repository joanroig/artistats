import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { OutputComponent } from '@app/@shared/output/output.component';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { Playlist } from '@app/models/playlist.model';
import { Track } from '@app/models/track.model';
import { DatabaseService } from '@app/services/database/database.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SpotifyService } from '@app/services/spotify/spotify.service';

@Component({
  selector: 'app-editorials',
  templateUrl: './editorials.component.html',
  styleUrls: ['./editorials.component.scss'],
})
export class EditorialsComponent implements OnInit {
  // Load controls
  isLoading = false;
  stop = false;
  pauseDatabaseUpdates = false;

  withErrors: string[] = [];

  playlistColumns: string[] = [
    'reorder',
    'position',
    'name',
    'author',
    'followers',
    // 'tracks',
    'lastFetch',
    // 'lastUpdate',
    'delete',
  ];
  trackColumns: string[] = ['reorder', 'position', 'name', 'artists', 'featured', 'delete'];
  playlists: Playlist[] = [];
  tracks: Track[] = [];

  @ViewChild('playlistsTable')
  playlistsTable!: MatTable<Playlist>;

  @ViewChild('tracksTable')
  tracksTable!: MatTable<Track>;

  @ViewChild(OutputComponent)
  output!: OutputComponent;

  constructor(
    private databaseService: DatabaseService,
    private dialogService: DialogService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit() {
    this.databaseService.getUpdates(DbId.editorials_playlists).subscribe((_) => {
      if (!this.pauseDatabaseUpdates) {
        this.syncPlaylists();
      }
    });
    this.databaseService.getUpdates(DbId.editorials_tracks).subscribe((_) => {
      if (!this.pauseDatabaseUpdates) {
        this.syncTracks();
      }
    });
  }

  addPlaylists() {
    this.dialogService.openAddDialog(DbId.editorials_playlists).subscribe((_) => {
      // this.sync();
    });
  }

  addTracks() {
    this.dialogService.openAddDialog(DbId.editorials_tracks).subscribe((_) => {
      // this.sync();
    });
  }

  // Synchronize with the database
  private syncPlaylists() {
    this.databaseService.getAllPlaylists(DbId.editorials_playlists).then((res) => {
      // Sort by stored position attribute
      res.sort((a, b) => {
        if (a.position === undefined) return 1;
        if (b.position === undefined) return -1;
        return a.position - b.position;
      });

      this.playlists = res;
      this.processMatches();
    });
  }

  // Synchronize with the database
  private syncTracks() {
    this.databaseService.getAllTracks(DbId.editorials_tracks).then((res) => {
      // Sort by stored position attribute
      res.sort((a, b) => {
        if (a.position === undefined) return 1;
        if (b.position === undefined) return -1;
        return a.position - b.position;
      });

      this.tracks = res;
      this.processMatches();
    });
  }

  // find all featured tracks
  async processMatches() {
    this.pauseDatabaseUpdates = true;

    let temp = this.tracks.map((x) => Object.assign({}, x));

    for (let track of temp) {
      track.featuredOn = [];
      for (let playlist of this.playlists) {
        let match = playlist.tracks?.find((tr) => tr.track.id === track.id);

        if (match) {
          track.featuredOn.push(playlist);
          await this.databaseService.setTrack(track.id, track, DbId.editorials_tracks);
        }
      }
    }

    this.tracks = temp;

    this.tracksTable.renderRows();

    this.pauseDatabaseUpdates = false;

    // this.syncTracks();
  }

  stopUpdate() {
    this.spotifyService.stopUpdate();
  }

  deletePlaylist(playlist: Playlist) {
    this.databaseService.delete(playlist.id, DbId.editorials_playlists).then((_) => {
      this.syncPlaylists();
    });
  }

  deleteTrack(track: Track) {
    this.databaseService.delete(track.id, DbId.editorials_tracks).then((_) => {
      this.syncTracks();
    });
  }

  async reorderPlaylists(event: CdkDragSortEvent) {
    const prevIndex = this.playlists.findIndex((d) => d === event.item.data);
    moveItemInArray(this.playlists, prevIndex, event.currentIndex);
    this.playlistsTable.renderRows();

    // Update database, be sure to unsubscribe to changes to prevent refreshing data while updating
    this.pauseDatabaseUpdates = true;

    let index = 0;
    for (var playlist of this.playlists) {
      playlist.position = index;
      await this.databaseService.setPlaylist(playlist.id, playlist, DbId.editorials_playlists);
      index++;
    }

    this.pauseDatabaseUpdates = false;
  }

  async reorderTracks(event: CdkDragSortEvent) {
    const prevIndex = this.tracks.findIndex((d) => d === event.item.data);
    moveItemInArray(this.tracks, prevIndex, event.currentIndex);
    this.tracksTable.renderRows();

    // Update database, be sure to unsubscribe to changes to prevent refreshing data while updating
    this.pauseDatabaseUpdates = true;

    let index = 0;
    for (var track of this.tracks) {
      track.position = index;
      await this.databaseService.setTrack(track.id, track, DbId.editorials_tracks);
      index++;
    }

    this.pauseDatabaseUpdates = false;
  }

  async updatePlaylists() {
    this.isLoading = true;
    this.output.captureLogs();

    let keys = await this.databaseService.getAllKeys(DbId.editorials_playlists);
    let failed = await this.spotifyService.insertPlaylists(keys, ModeType.update, DbId.editorials_playlists);

    this.withErrors.push(...failed);

    await this.processMatches();

    this.isLoading = false;
    this.output.stopCapturing();
  }
}
