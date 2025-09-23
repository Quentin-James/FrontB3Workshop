import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  styleUrl: './app.css',
  template: `
    <router-outlet></router-outlet>
    
  `
})
export class App {
  protected readonly title = signal('FrontAgri');
}
