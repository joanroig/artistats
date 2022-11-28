import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '@app/material.module';
import { LoaderComponent } from './loader/loader.component';
import { OutputComponent } from './output/output.component';

@NgModule({
  imports: [FlexLayoutModule, MaterialModule, TranslateModule, CommonModule],
  declarations: [LoaderComponent, OutputComponent],
  exports: [LoaderComponent, OutputComponent],
})
export class SharedModule {}
