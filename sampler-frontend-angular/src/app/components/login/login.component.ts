import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Connexion Administrateur</h2>
        <p class="login-desc">Cliquez pour vous connecter (simulation)</p>
        <button class="btn-login" (click)="login()">
          Se connecter
        </button>
        <p class="login-note">
          <strong>Note :</strong> Ceci est une simulation d'authentification.
          En production, un vrai système d'authentification serait implémenté.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #f5f5f5;
    }

    .login-card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 450px;
      width: 100%;
      text-align: center;
    }

    .login-card h2 {
      margin: 0 0 1rem 0;
      color: #111827;
      font-size: 1.8rem;
    }

    .login-desc {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .btn-login {
      width: 100%;
      padding: 1rem 2rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-login:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .login-note {
      margin-top: 2rem;
      padding: 1rem;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      text-align: left;
      border-radius: 4px;
      color: #92400e;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .login-note strong {
      color: #78350f;
    }
  `]
})
export class LoginComponent {
  constructor(private router: Router) {}

  login() {
    // Simulation de connexion
    localStorage.setItem('isAuthenticated', 'true');
    this.router.navigate(['/admin']);
  }
}
