import { bootstrapApplication } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';  // <-- corriger ici

const config = mergeApplicationConfig(appConfig, {
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
});

bootstrapApplication(AppComponent, config)  // <-- corriger ici
  .catch((err) => console.error(err));
