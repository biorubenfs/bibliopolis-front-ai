import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip token refresh for auth-related endpoints
  const isAuthEndpoint = req.url.includes('/auth/login') || 
                         req.url.includes('/auth/refresh') || 
                         req.url.includes('/auth/logout');
  
  // Clone request and add access token if available
  let authReq = req;
  const accessToken = authService.accessToken();
  
  if (accessToken && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      },
      withCredentials: true
    });
  } else if (isAuthEndpoint) {
    // For auth endpoints, only add withCredentials
    authReq = req.clone({
      withCredentials: true
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 and it's not the login/refresh endpoint, try to refresh the token
      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap((newToken) => {
            // Retry the original request with the new token from refresh
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              },
              withCredentials: true
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed due to expired or invalid refresh token
            // Clear auth state and redirect to login silently
            authService.clearAuth();
            router.navigate(['/login'], { 
              queryParams: { sessionExpired: 'true' } 
            });
            
            // Return a user-friendly error instead of the technical token error
            return throwError(() => new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'));
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
