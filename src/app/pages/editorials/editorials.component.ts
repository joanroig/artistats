import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { OutputComponent } from '@app/@shared/output/output.component';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { Playlist } from '@app/models/playlist.model';
import { Track } from '@app/models/track.model';
import { DatabaseService } from '@app/services/database/database.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import Utils from '@app/utils/Utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-editorials',
  templateUrl: './editorials.component.html',
  styleUrls: ['./editorials.component.scss'],
})
export class EditorialsComponent implements OnInit, OnDestroy {
  // Load controls
  isLoading = false;
  isStoppable = true;

  pausePlaylistUpdates = false;
  pauseTrackUpdates = false;

  withErrors: string[] = [];

  playlistColumns: string[] = [
    'reorder',
    'position',
    'name',
    'author',
    'followers',
    'tracks',
    'lastFetch',
    'lastUpdate',
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

  playlistUpdates: Subscription;
  trackUpdates: Subscription;

  // expose utils to the template
  Utils = Utils;

  constructor(
    private databaseService: DatabaseService,
    private dialogService: DialogService,
    private spotifyService: SpotifyService
  ) {
    this.playlistUpdates = this.databaseService.getUpdates(DbId.editorials_playlists).subscribe(async (_) => {
      if (!this.pausePlaylistUpdates) {
        await this.syncPlaylists();
        await this.updatePlaylistPositions();
        // await this.processMatches();
      }
    });
    this.trackUpdates = this.databaseService.getUpdates(DbId.editorials_tracks).subscribe(async (_) => {
      if (!this.pauseTrackUpdates) {
        await this.syncTracks();
        await this.updateTrackPositions();
      }
    });
  }

  ngOnInit() {
    // first load
    this.syncPlaylists();
    this.syncTracks();
  }

  ngOnDestroy(): void {
    this.playlistUpdates.unsubscribe();
    this.trackUpdates.unsubscribe();
  }

  addPlaylists() {
    this.dialogService.openAddDialog(DbId.editorials_playlists).subscribe((changes) => {
      // Process matches after the dialog is closed
      if (changes) {
        this.processMatches();
      }
    });
  }

  addTracks() {
    this.dialogService.openAddDialog(DbId.editorials_tracks).subscribe((changes) => {
      // Process matches after the dialog is closed
      if (changes) {
        this.processMatches();
      }
    });
  }

  // find all featured tracks
  async processMatches() {
    this.isLoading = true;
    this.isStoppable = false;
    this.pausePlaylistUpdates = true;
    this.pauseTrackUpdates = true;
    this.output.setLog('Processing matches...');

    for (let track of this.tracks) {
      track.featuredOn = [];
      for (let playlist of this.playlists) {
        if (playlist.tracks) {
          let matchIndex = playlist.tracks.findIndex((tr) => tr.track?.id === track.id);
          if (matchIndex >= 0) {
            // clone the object before modifying it (note that deeply-nested object are not cloned, just referenced, like playlist.tracks)
            let featPlaylist = { ...playlist };
            featPlaylist.trackAddedAt = new Date(playlist.tracks[matchIndex].added_at);
            featPlaylist.trackPosition = matchIndex + 1;
            track.featuredOn.push(featPlaylist);
            await this.databaseService.setTrack(track.id, track, DbId.editorials_tracks);
          }
        }
      }
    }

    this.output.clearLog();
    this.pausePlaylistUpdates = false;
    this.pauseTrackUpdates = false;
    this.isStoppable = true;
    this.isLoading = false;
  }

  stopUpdate() {
    this.isStoppable = false;
    this.spotifyService.stopUpdate();
  }

  async deletePlaylist(playlist: Playlist) {
    await this.databaseService.delete(playlist.id, DbId.editorials_playlists);
  }

  async deleteTrack(track: Track) {
    await this.databaseService.delete(track.id, DbId.editorials_tracks);
  }

  async refresh() {
    this.isLoading = true;
    this.output.startLogSession();

    let keys = await this.databaseService.getAllKeys(DbId.editorials_playlists);
    let res = await this.spotifyService.fetchPlaylists(keys, ModeType.update, DbId.editorials_playlists);

    this.withErrors.push(...res.failed);

    await this.processMatches();

    this.isLoading = false;
    this.output.stopLogSession();
  }

  async reorderPlaylists(event: CdkDragSortEvent) {
    const prevIndex = this.playlists.findIndex((d) => d === event.item.data);
    moveItemInArray(this.playlists, prevIndex, event.currentIndex);
    this.playlistsTable.renderRows();
    await this.updatePlaylistPositions();
  }

  async reorderTracks(event: CdkDragSortEvent) {
    const prevIndex = this.tracks.findIndex((d) => d === event.item.data);
    moveItemInArray(this.tracks, prevIndex, event.currentIndex);
    this.tracksTable.renderRows();
    await this.updateTrackPositions();
  }

  private async updatePlaylistPositions() {
    // Update database, be sure to unsubscribe to changes to prevent refreshing data while updating
    this.pausePlaylistUpdates = true;

    let index = 0;
    for (let playlist of this.playlists) {
      playlist.position = index;
      await this.databaseService.setPlaylist(playlist.id, playlist, DbId.editorials_playlists);
      index++;
    }
    this.pausePlaylistUpdates = false;
  }

  private async updateTrackPositions() {
    // Update database, be sure to unsubscribe to changes to prevent refreshing data while updating
    this.pauseTrackUpdates = true;

    let index = 0;
    for (let track of this.tracks) {
      track.position = index;
      await this.databaseService.setTrack(track.id, track, DbId.editorials_tracks);
      index++;
    }

    this.pauseTrackUpdates = false;
  }

  // Synchronize with the database
  private async syncPlaylists() {
    await this.databaseService.getAllPlaylists(DbId.editorials_playlists).then((res) => {
      // Sort by stored position attribute
      res.sort((a, b) => {
        return a.position - b.position;
      });

      this.playlists = res;
    });
  }

  // Synchronize with the database
  private async syncTracks() {
    await this.databaseService.getAllTracks(DbId.editorials_tracks).then((res) => {
      // Sort by stored position attribute
      res.sort((a, b) => {
        return a.position - b.position;
      });

      this.tracks = res;
    });
  }
}
