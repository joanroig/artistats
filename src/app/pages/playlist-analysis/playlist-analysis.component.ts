import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { OutputComponent } from '@app/@shared/output/output.component';
import { ClipboardType } from '@app/models/clipboard-type.model';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { Playlist } from '@app/models/playlist.model';
import { DatabaseService } from '@app/services/database/database.service';
import { DialogService } from '@app/services/dialog/dialog.service';
import { SettingsService } from '@app/services/settings/settings.service';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import {
  ANALYSIS_PLAYLISTS_SORT_ACTIVE,
  ANALYSIS_PLAYLISTS_SORT_DIRECTION,
  ANALYSIS_PLAYLISTS_SORT_REMEMBER,
} from '@app/utils/constants';
import Utils from '@app/utils/Utils';

@Component({
  selector: 'app-playlist-analysis',
  templateUrl: './playlist-analysis.component.html',
  styleUrls: ['./playlist-analysis.component.scss'],
})
export class PlaylistAnalysisComponent implements OnInit, AfterViewInit {
  // Load controls
  isLoading = false;
  isStoppable = false;
  stop = false;

  rememberPlaylistSort = true;
  matSortActive = '';
  matSortDirection: SortDirection = 'asc';

  filterValue = '';

  withErrors: string[] = [];

  playlistIds: string[] = [];

  displayedColumns: string[] = [
    'reorder',
    'position',
    'name',
    'author',
    // 'playlistUrl',
    'followersCount',
    'tracksCount',
    // 'lastFetch',
    'lastUpdate',
    'delete',
  ];

  playlists = new MatTableDataSource<Playlist>();

  @ViewChild(MatSort)
  sort!: MatSort;

  @ViewChild('table')
  table!: MatTable<Playlist>;

  @ViewChild(OutputComponent)
  output!: OutputComponent;

  // expose classes to the template
  Utils = Utils;
  ClipboardType = ClipboardType;

  get isSorted() {
    return this.sort.direction !== '';
  }

  constructor(
    private clipboard: Clipboard,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private databaseService: DatabaseService,
    private dialogService: DialogService,
    private spotifyService: SpotifyService,
    private settingsService: SettingsService
  ) {
    this.rememberPlaylistSort = this.settingsService.getBooleanSetting(ANALYSIS_PLAYLISTS_SORT_REMEMBER);

    if (this.rememberPlaylistSort) {
      this.matSortActive = this.settingsService.getSetting(ANALYSIS_PLAYLISTS_SORT_ACTIVE);
      this.matSortDirection = this.settingsService.getSetting(ANALYSIS_PLAYLISTS_SORT_DIRECTION) as SortDirection;
    }
  }

  ngAfterViewInit() {
    this.playlists.sort = this.sort;

    this.playlists.sortingDataAccessor = (data: any, sortHeaderId: string): string => {
      if (sortHeaderId === 'name' || sortHeaderId === 'author') {
        // remove blanks and compare strings in lowercase
        let val = data[sortHeaderId].toLocaleLowerCase().trim();

        // put names with special characters at the top of the list by adding a _ prefix
        const searchPattern = new RegExp(/^[^a-zA-Z0-9]/);
        if (searchPattern.test(val)) {
          val = '_' + val;
        }
        return val;
      }
      // compare strings in lowercase
      if (typeof data[sortHeaderId] === 'string') {
        return data[sortHeaderId].toLocaleLowerCase();
      }

      return data[sortHeaderId];
    };
  }

  ngOnInit() {
    // first load
    this.sync();
  }

  // fetch all playlists and update the table with the new data
  async updatePlaylists() {
    this.isLoading = true;
    this.isStoppable = true;
    this.output.startLogSession();

    let keys = await this.databaseService.getAllKeys(DbId.analysis_playlists);
    let res = await this.spotifyService.fetchPlaylists(keys, ModeType.update, DbId.analysis_playlists);

    this.withErrors.push(...res.failed);

    this.isStoppable = false;
    this.isLoading = false;
    this.output.stopLogSession();
  }

  // stop the update after finishing the current iteration
  stopUpdate() {
    this.isStoppable = false;
    this.spotifyService.stopUpdate();
  }

  // copy data to the clipboard
  copyToClipboard(type: ClipboardType) {
    let data = '';
    // get data filtered and sorted
    switch (type) {
      case ClipboardType.dates:
        this.playlists.sortData(this.playlists.filteredData, this.sort).forEach((p) => {
          data += this.datePipe.transform(p.lastUpdate, 'dd/MM/yyyy') + '\n';
        });
        break;
      case ClipboardType.followers:
        this.playlists.sortData(this.playlists.filteredData, this.sort).forEach((p) => {
          data += p.followersCount + '\n';
        });
        break;
    }
    this.clipboard.copy(data);
    this.snackBar.open('Data copied to the clipboard!', 'Close', {
      duration: 1000,
    });
  }

  async openAddDialog() {
    // listen to database updates
    let playlistUpdates = this.databaseService.getUpdates(DbId.analysis_playlists).subscribe(async (_) => {
      await this.sync();
    });

    // open the dialog
    this.dialogService.openAddDialog(DbId.analysis_playlists).subscribe(async (_) => {
      playlistUpdates.unsubscribe();
    });
  }

  isDragDisabled() {
    return this.isLoading || this.isSorted || this.filterValue !== '';
  }

  applyFilter() {
    let value = this.filterValue;
    value = value.trim(); // remove whitespace
    value = value.toLowerCase(); // datasource defaults to lowercase matches
    this.playlists.filter = value;
  }

  sortChange(sortState: Sort) {
    // save sort settings
    this.settingsService.setSetting(ANALYSIS_PLAYLISTS_SORT_ACTIVE, sortState.active);
    this.settingsService.setSetting(ANALYSIS_PLAYLISTS_SORT_DIRECTION, sortState.direction);
  }

  async reorderTable(event: CdkDragSortEvent) {
    const prevIndex = this.playlists.data.findIndex((d) => d === event.item.data);
    moveItemInArray(this.playlists.data, prevIndex, event.currentIndex);
    this.updatePositions();
  }

  async deletePlaylist(playlist: Playlist) {
    await this.databaseService.delete(playlist.id, DbId.analysis_playlists);
    await this.sync();
    await this.updatePositions();
  }

  // update the position attribute of all rows to match with the current table order
  private async updatePositions() {
    this.playlists.data.forEach((playlist, index) => {
      playlist.position = index;
    });

    // table update
    this.playlists.data = this.playlists.data;

    // update database
    for (let playlist of this.playlists.data) {
      await this.databaseService.setPlaylist(playlist.id, playlist, DbId.analysis_playlists);
    }
  }

  // synchronize with the database
  private async sync() {
    this.isLoading = true;
    let res = await this.databaseService.getAllPlaylists(DbId.analysis_playlists);
    // sort by stored position attribute
    res.sort((a, b) => {
      return a.position - b.position;
    });
    this.playlists.data = res;
    this.isLoading = false;
  }
}
