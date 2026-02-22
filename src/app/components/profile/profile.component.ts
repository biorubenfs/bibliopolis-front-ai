import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService, UpdateProfileDto, UpdatePasswordDto } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-profile',
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  authService = inject(AuthService);

  isSubmittingProfile = signal<boolean>(false);
  isSubmittingPassword = signal<boolean>(false);
  profileErrorMessage = signal<string>('');
  profileSuccessMessage = signal<string>('');
  passwordErrorMessage = signal<string>('');
  passwordSuccessMessage = signal<string>('');

  // Computed signal that automatically updates when currentUser changes
  avatarUrl = computed(() => {
    const user = this.authService.currentUser();
    return user ? `data:image/jpeg;base64,${user.avatar}` : '';
  });

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(20)]],
    newPassword: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(6)]]
  });

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.profileForm.patchValue({
        name: currentUser.name
      });
    }
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmittingProfile.set(true);
    this.profileErrorMessage.set('');
    this.profileSuccessMessage.set('');

    const data: UpdateProfileDto = {
      name: this.profileForm.value.name!
    };

    this.userService.updateProfile(data).subscribe({
      next: () => {
        // Refresh user data to get updated avatar from backend
        this.authService.refreshUser().subscribe({
          next: () => {
            this.isSubmittingProfile.set(false);
            this.profileSuccessMessage.set('Perfil actualizado correctamente');
          },
          error: () => {
            this.isSubmittingProfile.set(false);
            this.profileSuccessMessage.set('Perfil actualizado correctamente');
          }
        });
      },
      error: (error: Error) => {
        this.profileErrorMessage.set(error.message);
        this.isSubmittingProfile.set(false);
      }
    });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPassword.set(true);
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');

    const data: UpdatePasswordDto = {
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: this.passwordForm.value.newPassword!
    };

    this.userService.updatePassword(data).subscribe({
      next: () => {
        this.isSubmittingPassword.set(false);
        this.passwordSuccessMessage.set('Contraseña actualizada correctamente');
        this.passwordForm.reset();
      },
      error: (error: Error) => {
        this.passwordErrorMessage.set(error.message);
        this.isSubmittingPassword.set(false);
      }
    });
  }

  get name() {
    return this.profileForm.get('name');
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }
}
