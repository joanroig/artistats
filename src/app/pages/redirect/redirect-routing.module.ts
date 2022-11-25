import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

import { RedirectComponent } from './redirect.component';

const routes: Routes = [{ path: 'redirect', component: RedirectComponent, data: { title: marker('Redirect') } }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [],
})
export class RedirectRoutingModule {}
