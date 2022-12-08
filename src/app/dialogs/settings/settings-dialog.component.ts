import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DbId } from '@app/models/db-id.model';
import { DatabaseService } from '@app/services/database/database.service';
@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss'],
})
export class SettingsDialogComponent {
  constructor(private dialogRef: MatDialogRef<SettingsDialogComponent>, private databaseService: DatabaseService) {}

  // expose dbids to the template
  DbIds = DbId;
  pressed: Set<DbId> = new Set();

  needsRefresh = false;

  delete(dbId: DbId) {
    this.databaseService.clearDb(dbId);
    this.needsRefresh = true;
    this.pressed.add(dbId);
  }

  close(): void {
    this.dialogRef.close();
  }

  refresh() {
    location.reload();
  }
}
