// src/app/components/detalle-pedido/detalle-pedido.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Pedido, Pago } from '../../../models/pedido.model';
import { ComprobantePagoComponent } from './comprobante-pago.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule, ComprobantePagoComponent],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css']
})
export class DetallePedidoComponent {
  @Input() pedido!: Pedido;
  @Output() cerrar = new EventEmitter<void>();
  mostrarComprobante = false;
  comprobanteUrl?: string;
  metodoPago?: string;

  constructor(private http: HttpClient) {}

  abrirComprobante(p: Pago) {
    this.comprobanteUrl = p.comprobanteUrl!;
    this.metodoPago = p.idMedioPago === 1 ? 'Yape' : 'Plin';
    this.mostrarComprobante = true;
  }

  formatearFechaIso(f: string): string {
    return new Date(f).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  async validarPago(p: Pago) {
    const result = await Swal.fire({
      title: 'Validar pago',
      text: '¿Estás seguro de validar este pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, validar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.http
        .put(`http://www.chbackend.somee.com/api/Pago/${p.idPago}/validar`, {})
        .subscribe(() => {
          p.estadoPago = 'Pago Validado';
          Swal.fire({
            icon: 'success',
            title: 'Pago validado',
            text: 'El pago ha sido validado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        });
    }
  }

  async rechazarPago(p: Pago) {
    const result = await Swal.fire({
      title: 'Rechazar pago',
      text: '¿Estás seguro de rechazar este pago?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.http
        .put(`http://www.chbackend.somee.com/api/Pago/${p.idPago}/rechazar`, {})
        .subscribe(() => {
          p.estadoPago = 'Rechazado';
          Swal.fire({
            icon: 'success',
            title: 'Pago rechazado',
            text: 'El pago ha sido rechazado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        });
    }
  }
}