import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { Shell } from '@app/shell/shell.service';

const routes: Routes = [
  Shell.childRoutes([
    {
      path: 'playlistanalysis',
      loadChildren: () =>
        import('./pages/playlist-analysis/playlist-analysis.module').then((m) => m.PlaylistAnalysisModule),
    },
    {
      path: 'editorials',
      loadChildren: () => import('./pages/editorials/editorials.module').then((m) => m.EditorialsModule),
    },
    { path: 'about', loadChildren: () => import('./pages/about/about.module').then((m) => m.AboutModule) },
  ]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
