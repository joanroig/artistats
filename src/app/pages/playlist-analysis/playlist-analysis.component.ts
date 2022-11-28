import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { OutputComponent } from '@app/@shared/output/output.component';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { Playlist } from '@app/models/playlist.model';
import { DatabaseService } from '@app/services/database/database.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SpotifyService } from '@app/services/spotify/spotify.service';

@Component({
  selector: 'app-playlist-analysis',
  templateUrl: './playlist-analysis.component.html',
  styleUrls: ['./playlist-analysis.component.scss'],
})
export class PlaylistAnalysisComponent implements OnInit {
  // Load controls
  isLoading = false;
  stop = false;
  pauseDatabaseUpdates = false;

  withErrors: string[] = [];

  playlistIds: string[] = [];

  displayedColumns: string[] = [
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

  dataSource: Playlist[] = [];

  @ViewChild('table')
  table!: MatTable<Playlist>;

  @ViewChild(OutputComponent)
  output!: OutputComponent;

  constructor(
    private clipboard: Clipboard,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private databaseService: DatabaseService,
    private dialogService: DialogService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit() {
    this.databaseService.getUpdates(DbId.analysis_playlists).subscribe((_) => {
      if (!this.pauseDatabaseUpdates) {
        this.sync();
      }
    });
  }

  copyDates() {
    let dates = '';
    this.dataSource.forEach((p) => {
      dates += this.datePipe.transform(p.lastUpdate, 'dd/MM/yyyy') + '\n';
    });
    this.clipboard.copy(dates);
    this.snackBar.open('Dates copied to the clipboard!', 'Close', {
      duration: 1000,
    });
  }

  copyFollowers() {
    let followers = '';
    this.dataSource.forEach((p) => {
      followers += p.followersCount + '\n';
    });
    this.clipboard.copy(followers);
    this.snackBar.open('Followers copied to the clipboard!', 'Close', {
      duration: 1000,
    });
  }

  addPlaylists() {
    this.dialogService.openAddDialog(DbId.analysis_playlists).subscribe((_) => {
      // this.sync();
    });
  }

  // Synchronize with the database
  private sync() {
    this.databaseService.getAllPlaylists(DbId.analysis_playlists).then((res) => {
      // Sort by stored position attribute
      res.sort((a, b) => {
        if (a.position === undefined) return 1;
        if (b.position === undefined) return -1;
        return a.position - b.position;
      });

      this.dataSource = res;
    });
  }

  stopUpdate() {
    this.spotifyService.stopUpdate();
  }

  delete(playlist: Playlist) {
    this.databaseService.delete(playlist.id, DbId.analysis_playlists).then((_) => {
      this.sync();
    });
  }

  async reorderTable(event: CdkDragSortEvent) {
    const prevIndex = this.dataSource.findIndex((d) => d === event.item.data);
    moveItemInArray(this.dataSource, prevIndex, event.currentIndex);
    this.table.renderRows();

    // Update database, be sure to unsubscribe to changes to prevent refreshing data while updating
    this.pauseDatabaseUpdates = true;

    let index = 0;
    for (var playlist of this.dataSource) {
      playlist.position = index;
      await this.databaseService.setPlaylist(playlist.id, playlist, DbId.analysis_playlists);
      index++;
    }

    this.pauseDatabaseUpdates = false;

    // // Update view - not needed!
    // this.sync();
  }

  async updatePlaylists() {
    this.isLoading = true;
    this.output.captureLogs();

    let keys = await this.databaseService.getAllKeys(DbId.analysis_playlists);
    let failed = await this.spotifyService.insertPlaylists(keys, ModeType.update, DbId.analysis_playlists);

    this.withErrors.push(...failed);

    this.isLoading = false;
    this.output.stopCapturing();
  }
}
