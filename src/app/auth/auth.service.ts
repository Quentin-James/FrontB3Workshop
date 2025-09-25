import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { HTTPAuthBack } from '../Services/auth.backend';

/**
 * Interface pour la réponse de connexion
 * Note: Votre API retourne un status 200 vide, donc pas de contenu JSON
 */
interface LoginResponse {
  success?: boolean;
  message?: string;
}

/**
 * Interface pour la requête de connexion
 */
interface LoginRequest {
  mail: string;
  mot_de_passe: string;
}

/**
 * Interface pour la réponse de vérification du statut d'authentification
 */
interface AuthStatusResponse {
  isAuthenticated: boolean;
}

/**
 * Interface représentant un utilisateur retourné par l'API
 */
interface UserResponse {
  id: number;
  mail: string;
  mot_de_passe: string; // Note: stocker les mots de passe en clair n'est pas sécurisé
}

/**
 * Service de gestion de l'authentification
 * Gère la connexion, déconnexion et vérification du statut d'authentification
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Signal réactif indiquant si l'utilisateur est connecté */
  private readonly loggedIn = signal(false);
  
  /** Service de routage injecté pour la navigation */
  private readonly router = inject(Router);
  
  /** Service HTTP personnalisé pour les appels d'authentification */
  private readonly httpAuthBack = inject(HTTPAuthBack);

  /**
   * Authentifie un utilisateur avec email et mot de passe
   * Utilise l'endpoint POST /api/Authentification/login
   * @param username - L'email de l'utilisateur
   * @param password - Le mot de passe de l'utilisateur
   * @returns Observable<boolean> - true si l'authentification réussit, false sinon
   */
  login(username: string, password: string): Observable<boolean> {
    // Log de la tentative de connexion (sans exposer le mot de passe)
    console.log('Login attempt for user:', username);
    
    // Construction de l'objet de requête avec les bons champs
    const loginRequest: LoginRequest = {
      mail: username,
      mot_de_passe: password
    };
    
    console.log('Sending login request to API...');
    
    // Appel POST pour authentifier l'utilisateur côté serveur
    return this.httpAuthBack.post<any>('api/Authentification/login', loginRequest)
      .pipe(
        // Transformation de la réponse d'authentification
        map((response: any) => {
          console.log('Authentication response received:', response);
          
          // Si la réponse est un status 200 (succès), l'authentification a réussi
          // Votre API retourne un status 200 vide, donc on considère que c'est un succès
          console.log('User authenticated successfully');
          
          // Mise à jour du signal de connexion
          this.loggedIn.set(true);
          
          // Sauvegarde sécurisée des informations de session
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('userEmail', username);
          
          return true;
        }),
        // Gestion des erreurs HTTP
        catchError(error => {
          console.error('Login error:', error);
          
          // Log détaillé de l'erreur pour le débogage
          if (error.status === 401) {
            console.error('Unauthorized: Invalid credentials');
          } else if (error.status === 400) {
            console.error('Bad Request: Invalid request format');
          } else if (error.status === 500) {
            console.error('Server error during authentication');
          } else {
            console.error('Network or other error:', error.message);
          }
          
          // S'assurer que l'état local reflète l'échec d'authentification
          this.loggedIn.set(false);
          
          // Retour d'un Observable avec false en cas d'erreur
          return of(false);
        })
      );
  }

  /**
   * Vérifie le statut d'authentification auprès du serveur
   * @returns Observable<boolean> - true si l'utilisateur est authentifié, false sinon
   */
  checkAuthStatus(): Observable<boolean> {
    // Appel HTTP pour vérifier le statut d'authentification côté serveur
    return this.httpAuthBack.get<AuthStatusResponse>('api/Authentification/status')
      .pipe(
        // Extraction du statut d'authentification de la réponse
        map((response: AuthStatusResponse) => {
          const isAuth = response.isAuthenticated;
          
          // Mise à jour du signal local avec le statut du serveur
          this.loggedIn.set(isAuth);
          
          return isAuth;
        }),
        // Gestion des erreurs - considère l'utilisateur comme non authentifié
        catchError(() => {
          this.loggedIn.set(false);
          return of(false);
        })
      );
  }

  /**
   * Déconnecte l'utilisateur et nettoie toutes les données d'authentification
   */
  logout(): void {
    // Mise à jour du signal de connexion
    this.loggedIn.set(false);
    
    // Nettoyage complet du localStorage
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    
    // Redirection vers la page de connexion
    this.router.navigate(['/login']);
  }

  /**
   * Vérifie si l'utilisateur est actuellement connecté
   * Combine le signal réactif et la vérification du localStorage pour la persistance
   * @returns boolean - true si l'utilisateur est connecté, false sinon
   */
  isLoggedIn(): boolean {
    // Vérifie d'abord le signal réactif, puis le localStorage comme fallback
    return this.loggedIn() || localStorage.getItem('loggedIn') === 'true';
  }

  /**
   * Récupère l'email de l'utilisateur connecté
   * @returns string | null - l'email de l'utilisateur ou null si non connecté
   */
  getCurrentUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  /**
   * Récupère l'ID de l'utilisateur connecté (si disponible)
   * @returns number | null - l'ID de l'utilisateur ou null si non disponible
   */
  getCurrentUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }
}