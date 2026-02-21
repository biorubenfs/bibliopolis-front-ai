import { Component, ChangeDetectionStrategy, inject, output, signal, input } from '@angular/core';
import { LibraryService } from '../../../services/library.service';
import { Library } from '../../../models/library.model';

@Component({
  selector: 'app-delete-library-modal',
  imports: [],
  templateUrl: './delete-library-modal.component.html',
  styleUrl: './delete-library-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteLibraryModalComponent {
  private libraryService = inject(LibraryService);

  library = input.required<Library>();
  closeModal = output<void>();
  libraryDeleted = output<void>();

  isDeleting = signal<boolean>(false);
  errorMessage = signal<string>('');

  onClose(): void {
    this.closeModal.emit();
  }

  onDelete(): void {
    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.libraryService.deleteLibrary(this.library().id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.libraryDeleted.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isDeleting.set(false);
      }
    });
  }
}
