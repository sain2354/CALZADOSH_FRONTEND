// src/app/TIENDA-ONLINE/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { ProductoTienda, SizeOption } from '../models/producto-tienda.model';

export interface FilterParams {
  cat?: number;
  subCate?: number;
  genero?: string[];
  articulo?: string[];
  estilo?: string[];
  color?: string[];
  tallaU?: string[];
  precioMin?: number;
  precioMax?: number;
  q?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = 'https://www.chbackend.somee.com/api/Producto';
  private readonly imageBaseUrl = 'https://www.chbackend.somee.com';

  private filterSubject = new BehaviorSubject<FilterParams>({});
  public filters$ = this.filterSubject.asObservable();

  private productsSubject = new BehaviorSubject<ProductoTienda[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) { }

  fetchProducts(filters: FilterParams = {}): Observable<ProductoTienda[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params = params.set(key, value.join(','));
          }
        } else if (String(value).trim() !== '') {
          params = params.set(key, String(value));
        }
      }
    });
    return this.http.get<ProductoTienda[]>(this.baseUrl, { params }).pipe(
      tap(products => console.log(`Productos obtenidos (${products?.length ?? 0}) con filtros:`, filters)),
      catchError(this.handleError<ProductoTienda[]>('fetchProducts', []))
    );
  }

  loadProducts(useFilters?: FilterParams): void {
    const filtersToUse = useFilters ? { ...useFilters } : { ...this.filterSubject.getValue() };
    this.fetchProducts(filtersToUse).subscribe({
      next: (prods) => this.productsSubject.next(prods || []),
      error: err => {
        console.error('Error loading products:', err);
        this.productsSubject.next([]);
      }
    });
  }

  fetchProductById(id: number): Observable<ProductoTienda | null> {
    const url = `${this.baseUrl}/${id}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response) {
          console.error(`fetchProductById: No se recibió respuesta para el id=${id}`);
          return null;
        }

        // --- MAPEO FINAL Y CORRECTO ---
        // Se mapean únicamente las propiedades que existen en el modelo ProductoTienda.
        const product: ProductoTienda = {
          idProducto: response.idProducto,
          nombre: response.nombre,
          precioVenta: response.precioVenta,
          stock: response.stock,
          foto: response.foto,
          idCategoria: response.idCategoria,
          categoriaDescripcion: response.categoriaDescripcion,
          idSubCategoria: response.idSubCategoria,
          subCategoriaDescripcion: response.subCategoriaDescripcion,
          marca: response.marca,
          mpn: response.mpn,
          shippingInfo: response.shippingInfo,
          material: response.material,
          color: response.color,

          // Mapeo de tallas
          tallas: (response.sizes || response.tallas || response.tallaProducto || []).map((t: any) => ({
            idTalla: t.idTalla,
            idProducto: t.idProducto,
            usa: t.usa,
            eur: t.eur,
            cm: t.cm,
            stock: t.stock
          }))
        };

        if (!product.idProducto) {
          console.error("CRÍTICO: El 'idProducto' no fue encontrado en la respuesta de la API para el producto con id consultado:", id);
          console.error("Respuesta de la API recibida:", response);
          return null;
        }

        return product;
      }),
      catchError(this.handleError<ProductoTienda | null>(`fetchProductById id=${id}`))
    );
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) {
      return 'assets/images/placeholder.png';
    }
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.imageBaseUrl}${path}`;
  }

  getCurrentFilters(): FilterParams {
    return { ...this.filterSubject.getValue() };
  }

  setFilters(f: FilterParams): void {
    this.filterSubject.next({ ...f });
    this.loadProducts();
  }

  clearAllFilters(): void {
    this.filterSubject.next({});
    this.loadProducts();
  }

  setCategory(catId?: number | null): void {
    const cur = this.getCurrentFilters();
    if (catId === undefined || catId === null) {
      delete cur.cat;
    } else {
      cur.cat = catId;
    }
    delete cur.subCate;
    this.filterSubject.next(cur);
    this.loadProducts();
  }

  setSubCate(subCateId?: number | null): void {
    const cur = this.getCurrentFilters();
    if (subCateId === undefined || subCateId === null) {
      delete cur.subCate;
    } else {
      cur.subCate = subCateId;
    }
    this.filterSubject.next(cur);
    this.loadProducts();
  }

  toggleArrayItem(key: keyof FilterParams, item: string): void {
    const cur = this.getCurrentFilters();
    const arr: string[] = Array.isArray(cur[key]) ? (cur[key] as string[]).slice() : [];
    const idx = arr.indexOf(item);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(item);

    if (arr.length === 0) {
      delete cur[key];
    } else {
      (cur as any)[key] = arr;
    }

    this.filterSubject.next(cur);
    this.loadProducts();
  }

  setPriceRange(min?: number | null, max?: number | null): void {
    const cur = this.getCurrentFilters();
    if (min === undefined || min === null) delete cur.precioMin; else cur.precioMin = min;
    if (max === undefined || max === null) delete cur.precioMax; else cur.precioMax = max;
    this.filterSubject.next(cur);
    this.loadProducts();
  }

  setArray(key: keyof FilterParams, values?: string[]): void {
    const cur = this.getCurrentFilters();
    if (!values || values.length === 0) {
      delete cur[key];
    } else {
      (cur as any)[key] = values;
    }
    this.filterSubject.next(cur);
    this.loadProducts();
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} falló:`, error);
      return of(result as T);
    };
  }
}
