import { CdkDragSortEvent, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
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
    'followersCount',
    'tracksCount',
    'playlistUrl',
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
    this.playlists.sortData = this.customSort();
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

  // custom sort function
  customSort() {
    let sortFunction = (items: Playlist[], sort: MatSort): Playlist[] => {
      if (!sort.active || sort.direction === '') {
        return items;
      }
      return items.sort((a: Playlist, b: Playlist) => {
        let comparatorResult = 0;
        switch (sort.active) {
          // compare strings with localCompare
          case 'name':
          case 'author':
            // trim the strings to remove trailing blanks
            let aVal = a[sort.active]?.trim();
            let bVal = b[sort.active]?.trim();
            // compare against an empty string if the values are undefined
            aVal = aVal ? aVal : '';
            bVal = bVal ? bVal : '';
            comparatorResult = aVal.localeCompare(bVal);
            break;
          // compare numeric or date values
          default:
            comparatorResult = a[sort.active] < b[sort.active] ? 1 : -1;
            break;
        }
        return comparatorResult * (sort.direction == 'asc' ? 1 : -1);
      });
    };
    return sortFunction;
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
