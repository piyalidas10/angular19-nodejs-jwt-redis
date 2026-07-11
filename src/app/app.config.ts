import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/auth/interceptors/token.interceptor';
import { AuthService } from './core/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAppInitializer(async () => {
      const auth = inject(AuthService);

      try {
        await firstValueFrom(auth.fetchMe());
      } catch {
        // No active session.
      }
    }),
    provideAnimationsAsync(),
  ],
};
