
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService { // <<< CORRECCIÓN: El nombre de la clase era incorrecto

  private selectedCategorySource = new BehaviorSubject<string | null>(null);
  selectedCategory$: Observable<string | null> = this.selectedCategorySource.asObservable();

  private selectedBrandSource = new BehaviorSubject<number | null>(null);
  selectedBrand$: Observable<number | null> = this.selectedBrandSource.asObservable();

  constructor() { }

  setCategory(name: string | null) {
    this.selectedCategorySource.next(name);
  }

  setBrand(brandId: number | null) {
    this.selectedBrandSource.next(brandId);
  }
}
""