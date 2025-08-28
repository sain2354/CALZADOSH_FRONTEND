// src/app/services/pago.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'https://www.chbackend.somee.com/api/Pago';

  constructor(private http: HttpClient) { }

  validarPago(idPago: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPago}/validar`, {});
  }

  rechazarPago(idPago: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPago}/rechazar`, {});
  }
}