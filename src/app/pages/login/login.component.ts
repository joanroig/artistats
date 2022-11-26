import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from '@app/auth/authentication.service';
import { SpotifyService } from '@app/services/spotify/spotify.service';
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
    private authenticationService: AuthenticationService,
    private spotifyService: SpotifyService
  ) {
    // this.createForm();
  }

  ngOnInit() {
    this.spotifyService.loginStatusUpdate().subscribe((loginStatus) => {
      this.loginStatus = loginStatus;
    });
    // Get all user data updates
    let userDataSub = this.spotifyService.userDataUpdate().subscribe((userData) => {
      this.userData = userData;
      if (this.loginStatus === true) {
        // Unsubscribe to stop getting updates
        userDataSub.unsubscribe();
        // Save
        this.authenticationService.login({
          username: this.userData.display_name,
        });
        this.router.navigate([this.route.snapshot.queryParams['redirect'] || '/'], { replaceUrl: true });
      }
    });

    // Start the Spotify service
    this.spotifyService.init();
  }

  login() {
    this.spotifyService.login();
  }

  logout() {
    // this.clearData();
    // this.stopUpdate();
    // this.startupLoaded = false;
    this.spotifyService.logout();
  }

  // login() {
  //   this.isLoading = true;
  //   const login$ = this.authenticationService.login(this.loginForm.value);
  //   login$
  //     .pipe(
  //       finalize(() => {
  //         this.loginForm.markAsPristine();
  //         this.isLoading = false;
  //       }),
  //       untilDestroyed(this)
  //     )
  //     .subscribe(
  //       (credentials) => {
  //         log.debug(`${credentials.username} successfully logged in`);
  //         this.router.navigate([this.route.snapshot.queryParams['redirect'] || '/'], { replaceUrl: true });
  //       },
  //       (error) => {
  //         log.debug(`Login error: ${error}`);
  //         this.error = error;
  //       }
  //     );
  // }

  // private createForm() {
  //   this.loginForm = this.formBuilder.group({
  //     username: ['', Validators.required],
  //     password: ['', Validators.required],
  //     remember: true,
  //   });
  // }
}
