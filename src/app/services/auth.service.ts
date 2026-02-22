import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError, Observable, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginCredentials, UserResponse, User } from '../models/user.model';
import { ApiError } from '../models/error.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals for auth state
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  private authCheckComplete = signal<boolean>(false);

  constructor() {
    // Check if user is authenticated on initialization
    this.checkAuthStatus();
  }

  login(credentials: LoginCredentials): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${environment.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        // Mark as authenticated on successful login
        this.isAuthenticated.set(true);
        // Set user info from response
        this.currentUser.set(response.results.attributes);
        this.authCheckComplete.set(true);
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.authCheckComplete.set(false);
        this.router.navigate(['/login']);
      }),
      catchError(this.handleError)
    );
  }

  // Method for guards to check auth status
  checkAuth(): Observable<boolean> {
    // If auth check is already complete, return current status
    if (this.authCheckComplete()) {
      return of(this.isAuthenticated());
    }

    // Otherwise, perform auth check
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      map((response) => {
        // User is authenticated
        this.isAuthenticated.set(true);
        this.currentUser.set(response.results.attributes);
        this.authCheckComplete.set(true);
        return true;
      }),
      catchError(() => {
        // User is not authenticated or token expired
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.authCheckComplete.set(true);
        return of(false);
      })
    );
  }

  // Method to force refresh user data (e.g., after profile update)
  refreshUser(): Observable<User> {
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      map((response) => {
        this.currentUser.set(response.results.attributes);
        return response.results.attributes;
      }),
      catchError(this.handleError)
    );
  }

  private checkAuthStatus(): void {
    // Call /auth/me to verify if user is authenticated
    this.http.get<UserResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).subscribe({
      next: (response) => {
        // User is authenticated
        this.isAuthenticated.set(true);
        this.currentUser.set(response.results.attributes);
        this.authCheckComplete.set(true);
      },
      error: () => {
        // User is not authenticated or token expired
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.authCheckComplete.set(true);
      }
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.error && (error.error as ApiError).message) {
      // API error
      errorMessage = (error.error as ApiError).message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
