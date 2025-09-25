import { Component, output, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  /**
     * Defines the set of injectable objects that are visible to its view DOM children.
     * See [example](#injecting-a-class-with-a-view-provider).
     *
     */
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class LoginComponent {
 readonly username = signal('');
  readonly password = signal('');
  readonly errorMessage = signal('');
  readonly isLoading = signal(false);

  readonly loginSuccess= output<void>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly isFormValid = computed(() => 
    this.username().trim().length > 0 && this.password().trim().length > 0
  );


  onLogin(): void{
    if (!this.username().trim() || !this.password().trim()){
      this.errorMessage.set("Veuillez écrire le mail et le mot de passe")
      return;
    }
     this.isLoading.set(true);
    this.errorMessage.set('');
       this.auth.login(this.username(), this.password()).subscribe({
      next: (success) => {
        this.isLoading.set(false);
        if (success) {
          this.loginSuccess.emit();
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('Invalid credentials. Try admin / 1234');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Connection error');
      }
    });
  }



}

