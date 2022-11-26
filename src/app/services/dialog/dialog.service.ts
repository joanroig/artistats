import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddDialogComponent } from '@app/dialogs/add/add-dialog.component';

@Injectable({
  providedIn: 'root',
})
/**
 * Dialog handler.
 * Documentation: https://blog.angular-university.io/angular-material-dialog/
 */
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openAddDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    this.dialog.open(AddDialogComponent, dialogConfig);
  }
}
