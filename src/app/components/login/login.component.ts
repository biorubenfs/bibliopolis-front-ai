import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMessage = signal<string>('');
  infoMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    // Check if redirected due to session expiration
    const sessionExpired = this.route.snapshot.queryParamMap.get('sessionExpired');
    if (sessionExpired === 'true') {
      this.infoMessage.set('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.infoMessage.set('');

      const { email, password } = this.loginForm.value;

      this.authService.login({ 
        email: email!, 
        password: password! 
      }).subscribe({
        next: () => {
          this.router.navigate(['/libraries']);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    }
  }
}
