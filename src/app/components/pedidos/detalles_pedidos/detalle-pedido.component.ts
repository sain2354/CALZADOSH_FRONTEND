// src/app/components/detalle-pedido/detalle-pedido.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido, Pago } from '../../../models/pedido.model';
import { ComprobantePagoComponent } from './comprobante-pago.component';
import { PagoService } from '../../../services/pago.service';
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
  @Output() pagoActualizado = new EventEmitter<void>();
  mostrarComprobante = false;
  comprobanteUrl?: string;
  metodoPago?: string;

  constructor(private pagoService: PagoService) {}

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
      this.pagoService.validarPago(p.idPago).subscribe({
        next: () => {
          // Actualizar el estado del pago individual
          p.estadoPago = 'Pago Validado';
          
          // Actualizar el estado de pago general del pedido
          this.pedido.estadoPago = 'PAGO VALIDADO';
          
          this.pagoActualizado.emit();
          Swal.fire({
            icon: 'success',
            title: 'Pago validado',
            text: 'El pago ha sido validado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error validando pago:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo validar el pago. Por favor, intenta nuevamente.',
            confirmButtonColor: '#00bcd4'
          });
        }
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
      this.pagoService.rechazarPago(p.idPago).subscribe({
        next: () => {
          // Actualizar el estado del pago individual
          p.estadoPago = 'Rechazado';
          
          // Actualizar el estado de pago general del pedido
          this.pedido.estadoPago = 'RECHAZADO';
          
          this.pagoActualizado.emit();
          Swal.fire({
            icon: 'success',
            title: 'Pago rechazado',
            text: 'El pago ha sido rechazado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error rechazando pago:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo rechazar el pago. Por favor, intenta nuevamente.',
            confirmButtonColor: '#00bcd4'
          });
        }
      });
    }
  }
}