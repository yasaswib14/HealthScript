import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    // ✅ Routing setup
    provideRouter(routes),

    // ✅ SSR Hydration (no withNoDomReuse in stable versions)
    provideClientHydration(withEventReplay()),

    // ✅ HttpClient + Fetch API
    provideHttpClient(withFetch()),

    // ✅ Template-driven forms
    importProvidersFrom(FormsModule)
  ]
};
