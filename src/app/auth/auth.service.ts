import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { HTTPAuthBack } from '../Services/auth.backend';

/**
 * Interface pour la réponse de connexion (non utilisée actuellement)
 * Pourrait être utilisée pour une authentification basée sur token
 */
interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * Interface pour la requête de connexion (non utilisée actuellement)
 * Pourrait être utilisée pour typer les données d'entrée
 */
interface LoginRequest {
  username: string;
  password: string;
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
   * Authentifie un utilisateur avec nom d'utilisateur et mot de passe
   * @param username - L'email de l'utilisateur
   * @param password - Le mot de passe de l'utilisateur
   * @returns Observable<boolean> - true si l'authentification réussit, false sinon
   */
  login(username: string, password: string): Observable<boolean> {

    
    // Construction des paramètres URL avec encodage pour éviter les problèmes de caractères spéciaux
    const params = `?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const fullUrl = `api/Authentification${params}`;
    
    
    
    // Appel HTTP GET pour récupérer la liste des utilisateurs
    return this.httpAuthBack.get<UserResponse[]>(fullUrl)
      .pipe(
        // Transformation de la réponse pour vérifier l'authentification
        map((users: UserResponse[]) => {
          
          // Recherche d'un utilisateur correspondant aux identifiants fournis
          const matchedUser = users.find(user => 
            user.mail === username && user.mot_de_passe === password
          );
          
          if (matchedUser) {
            
            // Mise à jour du signal de connexion
            this.loggedIn.set(true);
            
            // Sauvegarde de l'état de connexion dans le localStorage pour la persistance
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userId', matchedUser.id.toString());
            
            return true;
          } else {
            // Authentification échouée
            console.log('Authentication failed - no matching user');
            return false;
          }
        }),
        // Gestion des erreurs HTTP
        catchError(error => {
          console.error('Login error:', error);
          console.error('Error details:', error.error);
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
   * Déconnecte l'utilisateur et nettoie les données d'authentification
   */
  logout(): void {
    // Mise à jour du signal de connexion
    this.loggedIn.set(false);
    
    // Nettoyage du localStorage
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('authToken'); // Note: 'userId' n'est pas supprimé
    
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
}