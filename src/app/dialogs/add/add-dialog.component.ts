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

  inputString: string = '';

  // Load controls
  isLoading = false;

  // boolean to return to the caller
  changes = false;

  dbId: DbId;

  // expose dbids to the template
  DbIds = DbId;

  resourceType: ResourceType;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<AddDialogComponent>,
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
    this.isLoading = true;
    this.output.startLogSession();

    // get strings line by line and remove empty strings
    let lines = this.inputString.replace(/\r\n/g, '\n').split('\n');
    lines = lines.filter((n) => n);

    // get all unique ids from the strings
    let ids: Set<string> = new Set<string>();
    let parsed = Utils.parseSpotifyIds(lines, this.resourceType);
    parsed.ids.forEach((item) => ids.add(item));

    // get lines with errors
    let errorLines = parsed.errorLines;

    // add error logs to the output
    if (parsed.errorLog.length > 0) {
      this.output.appendErrors(parsed.errorLog.join('\n'));
    }

    let res;

    // proceed if there is something to process
    if (ids.size > 0) {
      this.changes = true;

      switch (this.resourceType) {
        case ResourceType.playlist:
          res = await this.spotifyService.fetchPlaylists(Array.from(ids.values()), ModeType.new, this.dbId);
          break;
        case ResourceType.track:
          res = await this.spotifyService.fetchTracks(Array.from(ids.values()), this.dbId);
          break;
      }

      // append URIs with fetch errors
      res.failed.forEach((id) => {
        errorLines.push(`spotify:${this.resourceType}:${id}`);
      });
    }

    // replace input for the failed lines and URIs
    this.inputString = errorLines.join('\n');

    this.output.stopLogSession();
    this.isLoading = false;
  }

  close(): void {
    this.dialogRef.close(this.changes);
  }
}
