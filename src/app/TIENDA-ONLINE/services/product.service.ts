import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { ProductoTienda } from '../models/producto-tienda.model';

// Interfaz de filtros actualizada para usar 'nombre' en la búsqueda
export interface FilterParams {
  cat?: number;
  subCate?: number | number[];
  marca?: string;
  genero?: string[];
  articulo?: string[];
  estilo?: string[];
  color?: string[];
  tallaU?: string[];
  precioMin?: number;
  precioMax?: number;
  nombre?: string; // PARÁMETRO DE BÚSQUEDA CORREGIDO A 'nombre'
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
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach(item => { params = params.append(key, item); });
      } else if (String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ProductoTienda[]>(this.baseUrl, { params }).pipe(
      tap(products => console.log(`Productos obtenidos (${products?.length ?? 0}) con filtros:`, filters)),
      catchError(this.handleError<ProductoTienda[]>('fetchProducts', []))
    );
  }

  loadProducts(useFilters?: FilterParams): void {
    const filtersToUse = useFilters || this.filterSubject.getValue();
    this.fetchProducts(filtersToUse).subscribe({
      next: (prods) => this.productsSubject.next(prods || []),
      error: err => {
        console.error('Error al cargar productos:', err);
        this.productsSubject.next([]);
      }
    });
  }

  fetchProductById(id: number): Observable<ProductoTienda | null> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<any>(url).pipe(
      map(response => response ? this.mapToProductoTienda(response) : null),
      catchError(this.handleError<ProductoTienda | null>(`fetchProductById id=${id}`))
    );
  }

  private mapToProductoTienda(response: any): ProductoTienda {
    return {
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
      tallas: response.sizes || response.tallas || response.tallaProducto || []
    };
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return 'assets/images/placeholder.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.imageBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  getCurrentFilters(): FilterParams {
    return this.filterSubject.getValue();
  }

  setFilters(f: FilterParams): void {
    this.filterSubject.next(f);
    this.loadProducts();
  }

  clearAllFilters(): void {
    this.filterSubject.next({});
    this.loadProducts();
  }

  setCategory(catId?: number | null): void {
    const currentFilters = this.getCurrentFilters();
    delete currentFilters.subCate;
    if (catId) {
      currentFilters.cat = catId;
    } else {
      delete currentFilters.cat;
    }
    this.filterSubject.next(currentFilters);
    this.loadProducts();
  }

  // --- FUNCIÓN DE BÚSQUEDA CORREGIDA Y AISLADA ---
  setSearchTerm(term: string): void {
    const currentFilters = this.getCurrentFilters();
    const searchTerm = (term || '').trim();

    // Usamos 'nombre' para el filtro, que es el parámetro que espera el backend
    if (searchTerm) {
      currentFilters.nombre = searchTerm;
    } else {
      delete currentFilters.nombre;
    }
    
    this.filterSubject.next(currentFilters);
    this.loadProducts(); // Recargamos los productos con el filtro correcto
  }

  toggleArrayItem(key: keyof FilterParams, item: string): void {
    const cur = this.getCurrentFilters();
    const arr = (cur[key] as string[] || []).slice();
    const idx = arr.indexOf(item);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(item);
    
    if (arr.length > 0) {
      (cur as any)[key] = arr;
    } else {
      delete cur[key];
    }
    this.filterSubject.next(cur);
    this.loadProducts();
  }

  setPriceRange(min?: number | null, max?: number | null): void {
    const cur = this.getCurrentFilters();
    if (min) cur.precioMin = min; else delete cur.precioMin;
    if (max) cur.precioMax = max; else delete cur.precioMax;
    this.filterSubject.next(cur);
    this.loadProducts();
  }
  
  setArray(key: keyof FilterParams, values?: string[]): void {
    const cur = this.getCurrentFilters();
    if (values && values.length > 0) {
      (cur as any)[key] = values;
    } else {
      delete cur[key];
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
