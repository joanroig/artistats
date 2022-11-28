import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from '@app/auth/authentication.service';
import { environment } from '@env/environment';
import { Logger, UntilDestroy } from '@shared';

const log = new Logger('Login');

@UntilDestroy()
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  version: string | null = environment.version;
  error: string | undefined;
  // loginForm!: FormGroup;
  isLoading = false;

  loginStatus?: boolean;
  userData?: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    // private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService // private spotifyService: SpotifyService
  ) {
    // this.createForm();
  }

  ngOnInit() {
    // this.spotifyService.getLoginStatusUpdate().subscribe((loginStatus) => {
    //   this.loginStatus = loginStatus;
    // });
    // // Get all user data updates
    // let userDataSub = this.spotifyService.userDataUpdate().subscribe((userData) => {
    //   this.userData = userData;
    //   if (this.loginStatus === true) {
    //     // Unsubscribe to stop getting updates
    //     userDataSub.unsubscribe();
    //     // Save
    //     this.authenticationService.login({
    //       username: this.userData.display_name,
    //     });
    //     this.router.navigate([this.route.snapshot.queryParams['redirect'] || '/'], { replaceUrl: true });
    //   }
    // });
    // // Start the Spotify service
    // this.spotifyService.init();
  }

  login() {
    this.isLoading = true;
    this.authenticationService.login().then(
      (result) => {
        this.isLoading = false;
        this.router.navigate([this.route.snapshot.queryParams['redirect'] || '/'], { replaceUrl: true });
      },
      (err) => {
        this.isLoading = false;

        /* handles errors */
      }
    );
  }

  logout() {
    this.authenticationService.logout();
  }
}
