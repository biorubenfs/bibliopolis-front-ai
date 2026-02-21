import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibraryService } from '../../../services/library.service';
import { CreateLibraryDto } from '../../../models/library.model';

@Component({
  selector: 'app-create-library-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './create-library-modal.component.html',
  styleUrl: './create-library-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateLibraryModalComponent {
  private fb = inject(FormBuilder);
  private libraryService = inject(LibraryService);

  closeModal = output<void>();
  libraryCreated = output<void>();

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  libraryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.libraryForm.invalid) {
      this.libraryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const libraryData: CreateLibraryDto = {
      name: this.libraryForm.value.name!,
      description: this.libraryForm.value.description!
    };

    this.libraryService.createLibrary(libraryData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.libraryCreated.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSubmitting.set(false);
      }
    });
  }

  get name() {
    return this.libraryForm.get('name');
  }

  get description() {
    return this.libraryForm.get('description');
  }
}
