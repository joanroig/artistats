import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { Angulartics2Module } from 'angulartics2';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@app/material.module';
import { SharedModule } from '@shared';
import { MatTableExporterModule } from 'mat-table-exporter';
import { PlaylistAnalysisRoutingModule } from './playlist-analysis-routing.module';
import { PlaylistAnalysisComponent } from './playlist-analysis.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    SharedModule,
    FlexLayoutModule,
    MaterialModule,
    FormsModule,
    Angulartics2Module,
    DragDropModule,
    MatTableExporterModule,
    PlaylistAnalysisRoutingModule,
  ],
  declarations: [PlaylistAnalysisComponent],
  providers: [DatePipe],
})
export class PlaylistAnalysisModule {}
