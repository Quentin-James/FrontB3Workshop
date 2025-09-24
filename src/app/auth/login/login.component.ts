import { Component, EventEmitter, Output  } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  @Output() loginSuccess = new EventEmitter<void>(); // 🔥 émettre le succès


  constructor(private auth: AuthService, private router: Router) {}

  onLogin() {
    if (this.auth.login(this.username, this.password)) {
      this.errorMessage = '';
      this.loginSuccess.emit(); // 🔥 informer le parent
    } else {
      this.errorMessage = 'Invalid credentials. Try admin / 1234';
    } //invalide , reessayer pour se connecter
    }
  }

