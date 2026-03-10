export enum BooksSource {
  OPEN_LIBRARY = 'open_library',
  GOOGLE_BOOKS = 'google_books'
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn13: string;
  isbn10: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookItem {
  type: 'books';
  id: string;
  attributes: Book;
}

export interface BooksResponse {
  results: BookItem[];
  paginationInfo: {
    skip: number;
    limit: number;
    total: number;
  };
}

export interface ExternalBook {
  title: string;
  authors: string[];
  isbn13: string | null;
  isbn10: string | null;
  coverUrl: string;
  cover: {
    source: BooksSource | null;
    value: string | null;
  };
}

export interface ExternalBookResponse {
  results: {
    type: 'book-result';
    attributes: ExternalBook;
  };
}

export interface AddBookToLibraryDto {
  title: string;
  isbn13: string | null;
  isbn10: string | null;
  authors: string[];
  cover: {
    source: BooksSource | null;
    value: string | null;
  };
}
