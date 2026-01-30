import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

// Interceptor pour logger les requetes HTTP
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  
  console.log('HTTP Request:', req.method, req.url);
  
  return next(req).pipe(
    tap({
      next: (event) => {
        const elapsed = Date.now() - started;
        console.log('HTTP Response:', req.method, req.url, '-', elapsed + 'ms');
      },
      error: (error) => {
        const elapsed = Date.now() - started;
        console.error('HTTP Error:', req.method, req.url, '-', elapsed + 'ms', error);
      }
    })
  );
};
