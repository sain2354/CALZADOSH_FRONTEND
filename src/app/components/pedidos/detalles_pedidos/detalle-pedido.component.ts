import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Pedido, Pago } from '../../../services/pedido.service';
import { ComprobantePagoComponent } from './comprobante-pago.component';

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
    this.metodoPago    = p.idMedioPago === 1 ? 'Yape' : 'Plin';
    this.mostrarComprobante = true;
  }

  formatearFechaIso(f: string): string {
    return new Date(f).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  validarPago(p: Pago) {
    this.http
      .put(`http://www.chbackend.somee.com/api/Pago/${p.idPago}/validar`, {})
      .subscribe(() => p.estadoPago = 'Pago Validado');
  }

  rechazarPago(p: Pago) {
    this.http
      .put(`http://www.chbackend.somee.com/api/Pago/${p.idPago}/rechazar`, {})
      .subscribe(() => p.estadoPago = 'Rechazado');
  }
}
