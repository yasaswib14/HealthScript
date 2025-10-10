import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    // Routing setup
    provideRouter(routes),

    // Angular hydration for SSR
    provideClientHydration(withEventReplay()),

    // ✅ Add HttpClient support (for backend API calls)
    provideHttpClient(),

    // ✅ Add FormsModule support (for ngModel, forms, etc.)
    importProvidersFrom(FormsModule)
  ]
};
