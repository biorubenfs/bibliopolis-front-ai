import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JobResponse, JobsResponse } from '../models/job.model';
import { ApiError } from '../models/error.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private http = inject(HttpClient);

  getJob(jobId: string): Observable<JobResponse> {
    return this.http.get<JobResponse>(
      `${environment.apiUrl}/jobs/${jobId}`,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getJobsByResource(resourceId: string, type: string): Observable<JobsResponse> {
    const params = new HttpParams()
      .set('resourceId', resourceId)
      .set('type', type);

    return this.http.get<JobsResponse>(
      `${environment.apiUrl}/jobs`,
      { params, withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error && (error.error as ApiError).message) {
      errorMessage = (error.error as ApiError).message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
