import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private selectedCategorySubject = new BehaviorSubject<string>('Todos');
  selectedCategory$ = this.selectedCategorySubject.asObservable();

  private selectedBrandSubject = new BehaviorSubject<number | null>(null);
  selectedBrand$ = this.selectedBrandSubject.asObservable();

  setCategory(name: string) {
    this.selectedCategorySubject.next(name);
    // reset brand when category changes
    this.selectedBrandSubject.next(null);
  }

  setBrand(brandId: number | null) {
    this.selectedBrandSubject.next(brandId);
  }

  getSelectedCategory(): string {
    return this.selectedCategorySubject.getValue();
  }

  getSelectedBrand(): number | null {
    return this.selectedBrandSubject.getValue();
  }
}
