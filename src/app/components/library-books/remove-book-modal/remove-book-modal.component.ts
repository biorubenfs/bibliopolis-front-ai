import { Component, ChangeDetectionStrategy, inject, output, signal, input } from '@angular/core';
import { LibraryService } from '../../../services/library.service';
import { UserBook } from '../../../models/user-book.model';

@Component({
  selector: 'app-remove-book-modal',
  imports: [],
  templateUrl: './remove-book-modal.component.html',
  styleUrl: './remove-book-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RemoveBookModalComponent {
  private libraryService = inject(LibraryService);

  book = input.required<UserBook>();
  libraryId = input.required<string>();
  closeModal = output<void>();
  bookRemoved = output<void>();

  isRemoving = signal<boolean>(false);
  errorMessage = signal<string>('');

  onClose(): void {
    this.closeModal.emit();
  }

  onRemove(): void {
    this.isRemoving.set(true);
    this.errorMessage.set('');

    this.libraryService.removeBookFromLibrary(this.libraryId(), this.book().id).subscribe({
      next: () => {
        this.isRemoving.set(false);
        this.bookRemoved.emit();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isRemoving.set(false);
      }
    });
  }
}
