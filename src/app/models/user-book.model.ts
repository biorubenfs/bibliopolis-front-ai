export interface UserBook {
  id: string;
  libraries: string[];
  bookId: string;
  bookTitle: string;
  bookAuthors: string[];
  bookIsbn13: string;
  bookIsbn10: string;
  bookCoverUrl: string;
  rating: number | null;
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserBookItem {
  type: 'user-books';
  id: string;
  attributes: UserBook;
}

export interface UserBooksResponse {
  results: UserBookItem[];
  paginationInfo: {
    skip: number;
    limit: number;
    total: number;
  };
}
