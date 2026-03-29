import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { UserBook } from '../../../models/user-book.model';

@Component({
  selector: 'app-user-book-card',
  templateUrl: './user-book-card.component.html',
  styleUrl: './user-book-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserBookCardComponent {
  book = input.required<UserBook>();
  showDeleteButton = input<boolean>(false);
  showLibrariesCount = input<boolean>(false);

  cardClick = output<UserBook>();
  deleteClick = output<UserBook>();

  authorsText = computed(() => {
    const authors = this.book().bookAuthors;
    if (!authors || authors.length === 0) return 'Autor desconocido';
    return authors.join(', ');
  });

  ratingStars = computed(() => {
    const stars: boolean[] = [];
    const rating = this.book().rating || 0;
    for (let i = 0; i < 10; i++) {
      stars.push(i < rating);
    }
    return stars;
  });

  onCardClick(): void {
    this.cardClick.emit(this.book());
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.deleteClick.emit(this.book());
  }
}
