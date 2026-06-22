import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { setApiOverride } from './app/shared/api-url';

// Allow pointing the deployed app at a new backend without a rebuild:
// visit  https://your-frontend/?apiUrl=https://new-backend.b4a.run  once and
// the URL is saved in this browser. Clear it with  ?apiUrl=reset .
try {
  const param = new URLSearchParams(window.location.search).get('apiUrl');
  if (param) {
    setApiOverride(param === 'reset' ? '' : param);
    // Drop the query string so it isn't carried around / re-applied.
    const clean = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', clean);
  }
} catch {
  /* ignore */
}

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
