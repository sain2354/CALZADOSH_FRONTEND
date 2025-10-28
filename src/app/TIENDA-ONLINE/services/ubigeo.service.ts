
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export interface UbigeoItem {
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string; 
  inei: string;
}

@Injectable({
  providedIn: 'root'
})
export class UbigeoService {
  private apiUrl = '/api/v1/ubigeo';
  private ubigeoData$: Observable<UbigeoItem[]>;

  constructor(private http: HttpClient) {
    this.ubigeoData$ = this.http.get<any>(this.apiUrl).pipe(
      map(apiResponse => {
        const flatData: UbigeoItem[] = [];

        if (typeof apiResponse !== 'object' || apiResponse === null) {
          console.error('La respuesta de la API de Ubigeo no es un objeto válido.');
          return [];
        }

        const departamentosAPI = Object.values(apiResponse as any);

        for (const dep of (departamentosAPI as any[])) {
          if (!dep?.nombre || !dep.provincias) continue; // Guarda de seguridad
          const depNombre = dep.nombre;

          const provinciasAPI = Object.values(dep.provincias as any);

          for (const prov of (provinciasAPI as any[])) {
            if (!prov?.nombre || !prov.distritos) continue; // Guarda de seguridad
            const provNombre = prov.nombre;

            const distritosAPI = Object.values(prov.distritos as any);

            for (const dist of (distritosAPI as any[])) {
              // SOLUCIÓN REAL: El distrito es un string, no un objeto.
              const distNombre = dist;

              // Verificación final antes de añadir a la lista
              if (typeof depNombre === 'string' && typeof provNombre === 'string' && typeof distNombre === 'string') {
                // SOLUCIÓN FINAL: Limpiamos los espacios en blanco de TODOS los nombres
                flatData.push({
                  departamento: depNombre.trim(),
                  provincia: provNombre.trim(),
                  distrito: distNombre.trim(),
                  ubigeo: '', 
                  inei: ''
                });
              }
            }
          }
        }
        return flatData;
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Error fatal al procesar los datos de Ubigeo.', error);
        return of([]); 
      })
    );
  }

  getDepartamentos(): Observable<string[]> {
    return this.ubigeoData$.pipe(
      map(data => {
        const departamentos = new Set<string>();
        data.forEach(item => departamentos.add(item.departamento));
        return Array.from(departamentos).sort();
      })
    );
  }

  getProvincias(departamento: string): Observable<string[]> {
    return this.ubigeoData$.pipe(
      map(data => {
        const provincias = new Set<string>();
        data
          .filter(item => item.departamento === departamento)
          .forEach(item => provincias.add(item.provincia));
        return Array.from(provincias).sort();
      })
    );
  }

  getDistritos(departamento: string, provincia: string): Observable<string[]> {
    return this.ubigeoData$.pipe(
      map(data => {
        const distritos = new Set<string>();
        data
          .filter(item => item.departamento === departamento && item.provincia === provincia)
          .forEach(item => distritos.add(item.distrito));
        return Array.from(distritos).sort();
      })
    );
  }
}
