import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LibrariesResponse } from '../models/library.model';
import { UserBooksResponse } from '../models/user-book.model';
import { ApiError } from '../models/error.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private http = inject(HttpClient);

  getLibraries(search?: string, skip: number = 0, limit: number = 10): Observable<LibrariesResponse> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<LibrariesResponse>(
      `${environment.apiUrl}/libraries`,
      { 
        params,
        withCredentials: true 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getLibraryBooks(libraryId: string, skip: number = 0, limit: number = 10): Observable<UserBooksResponse> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<UserBooksResponse>(
      `${environment.apiUrl}/libraries/${libraryId}/books`,
      { 
        params,
        withCredentials: true 
      }
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
