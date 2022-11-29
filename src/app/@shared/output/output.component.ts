import { Component } from '@angular/core';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss'],
})
export class OutputComponent {
  // single line log
  log = '';
  // multiline error log
  errors = '';

  fetchLogUpdates: Subscription | undefined;
  fetchErrorUpdates: Subscription | undefined;

  constructor(private spotifyService: SpotifyService) {}

  /**
   * Clear the output and start listening to the log and errors of the Spotify Service
   */
  startLogSession() {
    this.clearLog();
    this.clearErrors();
    this.fetchLogUpdates = this.spotifyService.getFetchLogUpdates().subscribe((fetchLog) => {
      this.log = fetchLog;
    });
    this.fetchErrorUpdates = this.spotifyService.getFetchErrorUpdates().subscribe((errorLog) => {
      this.errors += errorLog + '\n';
    });
  }

  /**
   * Stop listening to the log and errors of the Spotify Service
   */
  stopLogSession() {
    this.fetchLogUpdates?.unsubscribe();
    this.fetchErrorUpdates?.unsubscribe();
  }

  /**
   * Manually add errors to the error log
   * @param errors
   */
  appendErrors(errors: string) {
    this.errors += errors + '\n';
  }

  /**
   * Manually set the output log
   * @param errors
   */
  setLog(log: string) {
    this.log = log;
  }

  clearLog() {
    this.log = '';
  }

  clearErrors() {
    this.errors = '';
  }
}
