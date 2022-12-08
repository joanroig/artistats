import { Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { AuthenticationService } from '@app/auth';
import { DialogService } from '@app/services/dialog/dialog.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() sidenav!: MatSidenav;
  name = 'User name';

  constructor(
    private router: Router,
    private titleService: Title,
    private authenticationService: AuthenticationService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.authenticationService.getUserDataUpdate().subscribe((userData: any) => {
      this.name = userData.display_name;
    });
  }

  refresh() {
    this.authenticationService.login();
  }

  settings() {
    this.dialogService.openSettingsDialog();
  }

  logout() {
    this.authenticationService.logout().subscribe(() => {
      this.router.navigate(['/login'], { replaceUrl: true });
    });
  }

  get username(): string | null {
    return this.name;
  }

  get title(): string {
    return this.titleService.getTitle();
  }
}
