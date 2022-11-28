import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddDialogComponent } from '@app/dialogs/add/add-dialog.component';
import { DbId } from '@app/models/db-id.model';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
/**
 * Dialog handler.
 * Documentation: https://blog.angular-university.io/angular-material-dialog/
 */
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openAddDialog(dbId: DbId): Observable<any> {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    // dialogConfig.height = '400px';
    dialogConfig.maxWidth = '800px';
    dialogConfig.data = {
      dbId,
    };

    let dialogRef = this.dialog.open(AddDialogComponent, dialogConfig);
    return dialogRef.afterClosed().pipe(take(1));
  }
}
