import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OutputComponent } from '@app/@shared/output/output.component';
import { DbId } from '@app/models/db-id.model';
import { ModeType } from '@app/models/mode-type.model';
import { ResourceType } from '@app/models/resource-type.model';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import Utils from '@app/utils/Utils';
@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
})
export class AddDialogComponent {
  @ViewChild(OutputComponent)
  output!: OutputComponent;

  inputString: String = '';

  // Load controls
  startupLoaded = false;
  isLoading = false;

  loginStatus?: boolean;
  userData?: any;

  dbId: DbId;

  resourceType;

  // expose dbids to the template
  DbIds = DbId;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddDialogComponent>,
    private spotifyService: SpotifyService
  ) {
    this.dbId = this.data.dbId;

    // set resource track based on the data type to store in the database
    switch (this.dbId) {
      case DbId.analysis_playlists:
      case DbId.editorials_playlists:
        this.resourceType = ResourceType.playlist;
        break;
      case DbId.editorials_tracks:
        this.resourceType = ResourceType.track;
        break;
    }
  }

  stopUpdate() {
    this.spotifyService.stopUpdate();
  }

  async updatePlaylists() {
    this.output.captureLogs();

    this.isLoading = true;

    // Reset ids
    let ids: Set<string> = new Set<string>();

    // Get strings line by line
    let lines = this.inputString.replace(/\r\n/g, '\n').split('\n');

    // Remove empty strings
    lines = lines.filter((n) => n);

    // Get all ids from the strings
    let res = Utils.parseSpotifyIds(lines, this.resourceType);
    res.ids.forEach((item) => ids.add(item));

    // Get ids with errors
    let errorIds = res.errorsIds;

    // Print errors
    if (res.errorLog.length > 0) {
      this.output.appendErrors(res.errorLog.join('\n'));
    }

    let errors: string[] = [];

    if (this.resourceType === ResourceType.playlist) {
      // Get data of all playlists
      errors = await this.spotifyService.insertPlaylists(Array.from(ids.values()), ModeType.new, this.dbId);
    } else if (this.resourceType === ResourceType.track) {
      // Get data of all tracks
      errors = await this.spotifyService.insertTracks(Array.from(ids.values()), ModeType.new, this.dbId);
    }

    // Append ids with fetch errors and show them in the input
    else
      errors.forEach((error) => {
        errorIds.push(`spotify:${this.resourceType}:${error}`);
      });

    this.inputString = errorIds.join('\n');

    this.isLoading = false;
    this.output.stopCapturing();
  }

  close(): void {
    this.dialogRef.close();
  }
}
