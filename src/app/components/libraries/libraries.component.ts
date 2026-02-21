import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { Library } from '../../models/library.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { CreateLibraryModalComponent } from './create-library-modal/create-library-modal.component';
import { EditLibraryModalComponent } from './edit-library-modal/edit-library-modal.component';
import { DeleteLibraryModalComponent } from './delete-library-modal/delete-library-modal.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-libraries',
  imports: [NavbarComponent, DatePipe, RouterLink, CreateLibraryModalComponent, EditLibraryModalComponent, DeleteLibraryModalComponent, PaginationComponent],
  templateUrl: './libraries.component.html',
  styleUrl: './libraries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibrariesComponent implements OnInit {
  private libraryService = inject(LibraryService);

  libraries = signal<Library[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  selectedLibrary = signal<Library | null>(null);
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(25);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  ngOnInit(): void {
    this.loadLibraries();
  }

  loadLibraries(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const skip = (this.currentPage() - 1) * this.itemsPerPage();
    const limit = this.itemsPerPage();

    this.libraryService.getLibraries(undefined, skip, limit).subscribe({
      next: (response) => {
        this.libraries.set(
          response.results.map(item => ({
            ...item.attributes,
            id: item.id
          }))
        );
        this.totalItems.set(response.paginationInfo.total);
        this.totalPages.set(Math.ceil(response.paginationInfo.total / this.itemsPerPage()));
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onLibraryCreated(): void {
    this.closeCreateModal();
    this.loadLibraries();
  }

  openEditModal(library: Library): void {
    this.selectedLibrary.set(library);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedLibrary.set(null);
  }

  onLibraryUpdated(): void {
    this.closeEditModal();
    this.loadLibraries();
  }

  openDeleteModal(library: Library): void {
    this.selectedLibrary.set(library);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedLibrary.set(null);
  }

  onLibraryDeleted(): void {
    this.closeDeleteModal();
    this.loadLibraries();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadLibraries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onItemsPerPageChange(newSize: number): void {
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1);
    this.loadLibraries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
