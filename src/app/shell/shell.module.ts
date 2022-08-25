import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthModule } from '@app/auth';
import { I18nModule } from '@app/i18n';
import { MaterialModule } from '@app/material.module';
import { RedirectModule } from '@app/redirect/redirect.module';
import { ShellComponent } from './shell.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FlexLayoutModule,
    MaterialModule,
    AuthModule,
    RedirectModule,
    I18nModule,
    RouterModule,
  ],
  declarations: [ShellComponent],
})
export class ShellModule {}
