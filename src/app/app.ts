import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './auth/login/login.component';
import { Dashboard } from './dashboard/dashboard'; // ton dashboard standalone

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, Dashboard],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  isAuthenticated = false;

  handleLoginSuccess() {
    this.isAuthenticated = true;
  }
}
