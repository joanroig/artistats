import { Component } from '@angular/core';
import { AuthenticationService } from '@app/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  loginStatus?: boolean;
  userData?: any;

  constructor(private authenticationService: AuthenticationService) {
    this.authenticationService.getLoginStatusUpdate().subscribe((loginStatus) => {
      this.loginStatus = loginStatus;
    });
    // Get all user data updates
    this.authenticationService.getUserDataUpdate().subscribe((userData) => {
      this.userData = userData;
    });
    // Start the Spotify service
    // this.spotifyService.init();}
  }
}
