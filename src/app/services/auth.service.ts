// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs'; // BehaviorSubject for login status

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_ROLE_STORAGE_KEY = 'userRole'; // Key for localStorage
  private readonly IS_LOGGED_IN_STORAGE_KEY = 'isLoggedIn'; // Key for localStorage
   private readonly USERNAME_STORAGE_KEY = 'username'; // Key for localStorage (optional)


  // Use BehaviorSubject to track login status reactively
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.checkLoginStatus());
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable(); // Public observable


  constructor(private router: Router) {
      // Check login status when the service is initialized
      this.isLoggedInSubject.next(this.checkLoginStatus());
  }

  // Call this method after a successful login from the backend
  loginSuccess(username: string, role: string): void { // Added username
    localStorage.setItem(this.USER_ROLE_STORAGE_KEY, role);
    localStorage.setItem(this.IS_LOGGED_IN_STORAGE_KEY, 'true'); // Store a flag
    localStorage.setItem(this.USERNAME_STORAGE_KEY, username); // Store username (optional)

    this.isLoggedInSubject.next(true); // Update the subject
    console.log('Login successful. Role:', role); // For debugging
    // Optionally redirect to the dashboard here or in the login component
    // this.router.navigate(['/dashboard']);
  }

  // Call this method to log out the user
  logout(): void {
    localStorage.removeItem(this.USER_ROLE_STORAGE_KEY);
    localStorage.removeItem(this.IS_LOGGED_IN_STORAGE_KEY);
    localStorage.removeItem(this.USERNAME_STORAGE_KEY); // Remove username

    this.userRole = null; // Clear the internal role cache
    this.isLoggedInSubject.next(false); // Update the subject

    console.log('User logged out.'); // For debugging
    this.router.navigate(['/login']); // Redirect to login page
  }

  // Check if the user is currently logged in
  isLoggedIn(): boolean {
    // Check the flag in localStorage
    return localStorage.getItem(this.IS_LOGGED_IN_STORAGE_KEY) === 'true';
  }

  // Get the role of the logged-in user from localStorage
  private userRole: string | null = null; // Cache the role

  getUserRole(): string | null {
    // Check cache first, then localStorage
    if (this.userRole === null) {
      this.userRole = localStorage.getItem(this.USER_ROLE_STORAGE_KEY);
    }
    return this.userRole;
  }

   // Get the username of the logged-in user from localStorage (optional)
   getUsername(): string | null {
       return localStorage.getItem(this.USERNAME_STORAGE_KEY);
   }


  // Check if the logged-in user has a specific role
  hasRole(roleName: string): boolean {
      const userRole = this.getUserRole();
      // Role check is case-insensitive for flexibility
      return userRole !== null && userRole.toLowerCase() === roleName.toLowerCase();
  }

  // Check if the logged-in user has any of the specified roles
  hasAnyRole(roleNames: string[]): boolean {
      const userRole = this.getUserRole();
      if (userRole === null) return false; // Not logged in

      // Check if the user's role is in the list of required roles (case-insensitive)
      return roleNames.some(requiredRole => userRole.toLowerCase() === requiredRole.toLowerCase());
  }

  // Helper method to check login status on service initialization
  private checkLoginStatus(): boolean {
      return localStorage.getItem(this.IS_LOGGED_IN_STORAGE_KEY) === 'true';
  }
}
