import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '@app/services/spotify/spotify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss'],
})
export class OutputComponent implements OnInit {
  errors = '';
  fetchLog = '';

  fetchLogUpdates: Subscription | undefined;
  fetchErrorUpdates: Subscription | undefined;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {}

  captureLogs() {
    this.clearData();
    this.fetchLogUpdates = this.spotifyService.getFetchLogUpdates().subscribe((fetchLog) => {
      this.fetchLog = fetchLog;
    });
    this.fetchErrorUpdates = this.spotifyService.getFetchErrorUpdates().subscribe((errorLog) => {
      this.errors += errorLog + '\n';
    });
  }

  stopCapturing() {
    this.fetchLogUpdates?.unsubscribe();
    this.fetchErrorUpdates?.unsubscribe();
  }

  appendErrors(errors: string) {
    this.errors += errors + '\n';
  }

  clearData() {
    this.errors = '';
    this.fetchLog = '';
  }
}
