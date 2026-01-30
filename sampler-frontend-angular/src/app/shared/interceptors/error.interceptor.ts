import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

// Interceptor pour gerer les erreurs HTTP
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Affiche l'erreur dans la console
      console.error('Erreur HTTP:', error);
      return throwError(() => error);
    })
  );
};
