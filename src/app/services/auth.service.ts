import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap, throwError, Observable, of, map, switchMap, BehaviorSubject, filter, take, switchMap as rxSwitchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginCredentials, UserResponse, User, AuthResponse } from '../models/user.model';
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
  accessToken = signal<string | null>(null);
  private authCheckComplete = signal<boolean>(false);
  
  // Refresh token management
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Auth check will be handled by checkAuth() method when guards or components need it
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        // Store access token
        this.accessToken.set(response.results.attributes.accessToken);
        // Mark as authenticated on successful login
        this.isAuthenticated.set(true);
        this.authCheckComplete.set(true);
        // Fetch user data after successful login
        this.fetchUserData().subscribe();
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
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        // Even if logout fails on the server, clear local state
        this.clearAuth();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<string> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1)
      ) as Observable<string>;
    }

    // Mark refresh as in progress
    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        const newToken = response.results.attributes.accessToken;
        // Update access token
        this.accessToken.set(newToken);
        this.isAuthenticated.set(true);
        // Notify all waiting requests
        this.refreshTokenSubject.next(newToken);
        this.refreshTokenInProgress = false;
      }),
      map((response) => response.results.attributes.accessToken),
      catchError((error) => {
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  clearAuth(): void {
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.accessToken.set(null);
    // Mark as complete so guards don't try to refresh
    this.authCheckComplete.set(true);
  }

  // Method for guards to check auth status
  checkAuth(): Observable<boolean> {
    // If auth check is already complete, return current status
    if (this.authCheckComplete()) {
      return of(this.isAuthenticated());
    }

    // If we have an access token, try to fetch user data
    if (this.accessToken()) {
      return this.fetchUserData().pipe(
        map(() => {
          this.authCheckComplete.set(true);
          return true;
        }),
        catchError(() => {
          // Token might be expired, try to refresh
          return this.refreshToken().pipe(
            switchMap(() => this.fetchUserData()),
            map(() => {
              this.authCheckComplete.set(true);
              return true;
            }),
            catchError(() => {
              this.clearAuth();
              this.authCheckComplete.set(true);
              return of(false);
            })
          );
        })
      );
    }

    // No access token, try to refresh from cookie
    return this.refreshToken().pipe(
      switchMap(() => this.fetchUserData()),
      map(() => {
        this.authCheckComplete.set(true);
        return true;
      }),
      catchError(() => {
        this.clearAuth();
        this.authCheckComplete.set(true);
        return of(false);
      })
    );
  }

  // Simpler check for login guard - only checks current state without trying to refresh
  isCurrentlyAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  // Method to force refresh user data (e.g., after profile update)
  refreshUser(): Observable<User> {
    return this.fetchUserData().pipe(
      catchError(this.handleError)
    );
  }

  private fetchUserData(): Observable<User> {
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      map((response) => {
        this.currentUser.set(response.results.attributes);
        this.isAuthenticated.set(true);
        return response.results.attributes;
      })
    );
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
