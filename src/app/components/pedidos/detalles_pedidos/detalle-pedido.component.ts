import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComprobantePagoComponent } from './comprobante-pago.component';

type EstadoPedido = 'Pendiente Validación' | 'Pago Validado' | 'En Preparación' | 'Enviado' | 'Entregado' | 'Cancelado';
type MetodoPago = 'Yape' | 'Plin';
type EstadoPago = 'Pendiente' | 'Validado' | 'Rechazado';

interface ProductoPedido {
  id: string;
  nombre: string;
  imagen: string;
  cantidad: number;
  talla: string;
  precioUnitario: number;
}

interface Pedido {
  id: string;
  cliente: string;
  productos: ProductoPedido[];
  total: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  estadoPedido: EstadoPedido;
  pago: {
    metodo: MetodoPago;
    estado: EstadoPago;
    comprobante: string;
    codigoValidacion?: string;
    fechaValidacion?: Date;
  };
  direccionEnvio: string;
  telefonoContacto: string;
}

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
  @Output() actualizarEstadoPago = new EventEmitter<{id: string, estado: EstadoPago}>();
  
  mostrarComprobante = false;

  validarPago(esValido: boolean) {
    const nuevoEstado: EstadoPago = esValido ? 'Validado' : 'Rechazado';
    this.actualizarEstadoPago.emit({
      id: this.pedido.id,
      estado: nuevoEstado
    });
    this.cerrar.emit();
  }
}