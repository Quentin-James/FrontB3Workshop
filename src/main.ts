import { bootstrapApplication } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const config = mergeApplicationConfig(appConfig, {
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
});

bootstrapApplication(App, config)
  .catch((err) => console.error(err));
