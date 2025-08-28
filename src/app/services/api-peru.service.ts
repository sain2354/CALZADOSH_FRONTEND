// src/app/services/api-peru.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiPeruService {
  private apiUrl = 'https://www.chbackend.somee.com/api/apiperu'; // Ajusta si cambia

  constructor(private http: HttpClient) { }

  private normalize(raw: any) {
    if (!raw) return {};

    // Si vino envuelto otra vez como { success, data }
    if (raw.success && raw.data) raw = raw.data;

    // Algunas APIs devuelven JsonElement-like. Intentamos leer strings directamente.
    const get = (obj: any, ...keys: string[]) => {
      for (const k of keys) {
        if (obj == null) continue;
        if (obj[k] !== undefined && obj[k] !== null) {
          return obj[k];
        }
        // si viene como objeto con property string value
        if (typeof obj === 'object') {
          const lowk = Object.keys(obj).find(x => x.toLowerCase() === k.toLowerCase());
          if (lowk && obj[lowk] !== undefined) return obj[lowk];
        }
      }
      return null;
    };

    const nombres = get(raw, 'nombre', 'nombres', 'nombres_completos', 'nombresCompleto');
    const apellidoP = get(raw, 'apellidoPaterno', 'apellido_paterno');
    const apellidoM = get(raw, 'apellidoMaterno', 'apellido_materno');
    const razonSocial = get(raw, 'razonSocial', 'razon_social', 'razon');
    const direccion = get(raw, 'direccion', 'direccion_completa', 'domicilio_fiscal', 'direccionFiscal');
    const telefono = get(raw, 'telefono', 'celular', 'telf', 'telefono_fijo');
    const email = get(raw, 'email', 'correo', 'mail');

    const nombreCompleto = nombres
      ? `${nombres}`.trim()
      : ((apellidoP ?? '') + ' ' + (apellidoM ?? '') + ' ' + (nombres ?? '')).trim();

    return {
      // siempre strings (vacío si no hay)
      nombre: (nombreCompleto ?? razonSocial ?? '') ?? '',
      nombres: nombres ?? '',
      apellidoPaterno: apellidoP ?? '',
      apellidoMaterno: apellidoM ?? '',
      razonSocial: razonSocial ?? '',
      direccion: direccion ?? '',
      direccion_completa: direccion ?? '',
      telefono: telefono ?? '',
      email: email ?? ''
    };
  }

  consultarDni(dni: string): Observable<any> {
    if (!dni || dni.length !== 8) {
      return throwError(() => new Error('DNI debe tener 8 dígitos'));
    }

    return this.http.get<any>(`${this.apiUrl}/dni/${dni}`).pipe(
      map(res => this.normalize(res)),
      catchError(error => {
        console.error('Error en consulta DNI (service):', error);
        const message = error?.error?.message || error?.message || 'Error al consultar DNI';
        return throwError(() => new Error(message));
      })
    );
  }

  consultarRuc(ruc: string): Observable<any> {
    if (!ruc || ruc.length !== 11) {
      return throwError(() => new Error('RUC debe tener 11 dígitos'));
    }

    return this.http.get<any>(`${this.apiUrl}/ruc/${ruc}`).pipe(
      map(res => this.normalize(res)),
      catchError(error => {
        console.error('Error en consulta RUC (service):', error);
        const message = error?.error?.message || error?.message || 'Error al consultar RUC';
        return throwError(() => new Error(message));
      })
    );
  }
}
