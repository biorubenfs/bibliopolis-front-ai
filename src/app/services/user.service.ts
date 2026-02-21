import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiError } from '../models/error.model';

export interface UpdateProfileDto {
  name: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  updateProfile(data: UpdateProfileDto): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}/users/me`,
      data,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updatePassword(data: UpdatePasswordDto): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}/users/me/password`,
      data,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
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
