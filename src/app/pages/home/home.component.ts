import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '@app/services/spotify/spotify.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loginStatus?: boolean;
  userData?: any;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.spotifyService.loginStatusUpdate().subscribe((loginStatus) => {
      this.loginStatus = loginStatus;
    });

    // Get all user data updates
    this.spotifyService.userDataUpdate().subscribe((userData) => {
      this.userData = userData;
    });

    // Start the Spotify service
    this.spotifyService.init();
  }
}
