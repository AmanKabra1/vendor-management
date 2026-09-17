import { Component } from '@angular/core';
import { LoadingService } from './shared/loading.service';
import { I18nService } from './shared/i18n.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';
  constructor(public loading: LoadingService, public i18n: I18nService) {}
}
