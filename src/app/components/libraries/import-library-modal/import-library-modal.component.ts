import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibraryService } from '../../../services/library.service';
import { LucideAngularModule, X, Upload } from 'lucide-angular';

@Component({
  selector: 'app-import-library-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './import-library-modal.component.html',
  styleUrl: './import-library-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportLibraryModalComponent {
  readonly icons = { X, Upload };
  private fb = inject(FormBuilder);
  private libraryService = inject(LibraryService);

  closeModal = output<void>();
  libraryImported = output<void>();

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedFile = signal<File | null>(null);
  fileError = signal<string>('');

  importForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]]
  });

  get remainingChars(): number {
    const currentLength = this.description?.value?.length || 0;
    return 100 - currentLength;
  }

  get name() {
    return this.importForm.get('name');
  }

  get description() {
    return this.importForm.get('description');
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !file.name.endsWith('.csv')) {
      this.fileError.set('Solo se permiten archivos CSV');
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    this.fileError.set('');
    this.selectedFile.set(file);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.importForm.invalid) {
      this.importForm.markAllAsTouched();
      return;
    }

    if (!this.selectedFile()) {
      this.fileError.set('Debes seleccionar un fichero CSV');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.libraryService.importLibraryFromCsv(
      this.selectedFile()!,
      this.importForm.value.name!,
      this.importForm.value.description!
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.libraryImported.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSubmitting.set(false);
      }
    });
  }
}
