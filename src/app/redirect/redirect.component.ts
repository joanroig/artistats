import { Component, OnInit } from '@angular/core';

import { Logger, UntilDestroy } from '@shared';

const log = new Logger('Redirect');

@UntilDestroy()
@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit {
  constructor() {}

  // https://developer.spotify.com/documentation/general/guides/authorization/implicit-grant/
  ngOnInit() {
    // Todo: check errors
    const spotifyAccessToken = window.location.hash.substr(1).split('&')[0].split('=')[1];

    //you must clear localStorage for main page listener to trigger on all(including duplicate) entries
    localStorage.removeItem('accessToken');
    localStorage.setItem('accessToken', spotifyAccessToken);

    setTimeout(function () {
      window.close();
    }, 1000);
  }
}
