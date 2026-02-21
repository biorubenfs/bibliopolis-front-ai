import { Component, ChangeDetectionStrategy, inject, output, signal, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibraryService } from '../../../services/library.service';
import { CreateLibraryDto, Library } from '../../../models/library.model';

@Component({
  selector: 'app-edit-library-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-library-modal.component.html',
  styleUrl: './edit-library-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditLibraryModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private libraryService = inject(LibraryService);

  library = input.required<Library>();
  closeModal = output<void>();
  libraryUpdated = output<void>();

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  libraryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit(): void {
    this.libraryForm.patchValue({
      name: this.library().name,
      description: this.library().description
    });
  }

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

    this.libraryService.updateLibrary(this.library().id, libraryData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.libraryUpdated.emit();
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
