import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { I18nModule } from '@app/i18n';
import { MaterialModule } from '@app/material.module';
import { SharedModule } from '@shared';
import { RedirectRoutingModule } from './redirect-routing.module';
import { RedirectComponent } from './redirect.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedModule,
    FlexLayoutModule,
    MaterialModule,
    I18nModule,
    RedirectRoutingModule,
  ],
  declarations: [RedirectComponent],
})
export class RedirectModule {}
