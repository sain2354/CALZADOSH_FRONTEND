import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetallePedidoComponent } from './detalles_pedidos/detalle-pedido.component';

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
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, DetallePedidoComponent],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent {
  pedidos: Pedido[] = [
    {
      id: 'PED-001',
      cliente: 'Juan Pérez',
      productos: [
        {
          id: 'ZAP-001',
          nombre: 'Zapatillas Running',
          imagen: 'assets/productos/zap-running.jpg',
          cantidad: 1,
          talla: '40',
          precioUnitario: 120.50
        }
      ],
      total: 120.50,
      fechaCreacion: new Date('2023-06-15T10:30:00'),
      fechaActualizacion: new Date('2023-06-15T10:30:00'),
      estadoPedido: 'Pendiente Validación',
      pago: {
        metodo: 'Yape',
        estado: 'Pendiente',
        comprobante: 'assets/comprobantes/yape-001.jpg',
        codigoValidacion: '5A6B7C'
      },
      direccionEnvio: 'Av. Lima 123, Miraflores',
      telefonoContacto: '987654321'
    },
    {
      id: 'PED-002',
      cliente: 'María Gómez',
      productos: [
        {
          id: 'ZAP-002',
          nombre: 'Zapatos Formales',
          imagen: 'assets/productos/zap-formal.jpg',
          cantidad: 2,
          talla: '38',
          precioUnitario: 85.30
        }
      ],
      total: 170.60,
      fechaCreacion: new Date('2023-06-14T15:45:00'),
      fechaActualizacion: new Date('2023-06-15T09:20:00'),
      estadoPedido: 'En Preparación',
      pago: {
        metodo: 'Plin',
        estado: 'Validado',
        comprobante: 'assets/comprobantes/plin-002.jpg',
        codigoValidacion: '3D4E5F',
        fechaValidacion: new Date('2023-06-14T16:30:00')
      },
      direccionEnvio: 'Calle Los Pinos 456, Surco',
      telefonoContacto: '912345678'
    }
  ];

  pedidoSeleccionado: Pedido | null = null;
  mostrarDetalle = false;
  mostrarFiltros = false;
  
  filtros = {
    estadoPedido: '',
    estadoPago: '',
    metodoPago: '',
    fechaDesde: '',
    fechaHasta: '',
    cliente: ''
  };

  get pedidosFiltrados(): Pedido[] {
    return this.pedidos.filter(pedido => {
      const cumpleEstadoPedido = !this.filtros.estadoPedido || pedido.estadoPedido === this.filtros.estadoPedido;
      const cumpleEstadoPago = !this.filtros.estadoPago || pedido.pago.estado === this.filtros.estadoPago;
      const cumpleMetodo = !this.filtros.metodoPago || pedido.pago.metodo === this.filtros.metodoPago;
      const cumpleCliente = !this.filtros.cliente || 
                          pedido.cliente.toLowerCase().includes(this.filtros.cliente.toLowerCase());
      
      let cumpleFecha = true;
      if (this.filtros.fechaDesde) {
        const fechaDesde = new Date(this.filtros.fechaDesde);
        cumpleFecha = cumpleFecha && new Date(pedido.fechaCreacion) >= fechaDesde;
      }
      if (this.filtros.fechaHasta) {
        const fechaHasta = new Date(this.filtros.fechaHasta);
        cumpleFecha = cumpleFecha && new Date(pedido.fechaCreacion) <= fechaHasta;
      }
      
      return cumpleEstadoPedido && cumpleEstadoPago && cumpleMetodo && cumpleCliente && cumpleFecha;
    });
  }

  verDetalle(pedido: Pedido) {
    this.pedidoSeleccionado = pedido;
    this.mostrarDetalle = true;
  }

  eliminarPedido(pedido: Pedido) {
    if(confirm(`¿Está seguro de eliminar el pedido ${pedido.id}?`)) {
      this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
    }
  }

  cambiarEstadoPedido(pedido: Pedido, event: Event) {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value as EstadoPedido;
    
    pedido.estadoPedido = nuevoEstado;
    pedido.fechaActualizacion = new Date();
    
    // Si el estado es "Pago Validado", actualizar también el estado de pago
    if(nuevoEstado === 'Pago Validado') {
      pedido.pago.estado = 'Validado';
      pedido.pago.fechaValidacion = new Date();
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  limpiarFiltros() {
    this.filtros = {
      estadoPedido: '',
      estadoPago: '',
      metodoPago: '',
      fechaDesde: '',
      fechaHasta: '',
      cliente: ''
    };
  }

  actualizarEstadoPago(event: {id: string, estado: EstadoPago}) {
    const pedido = this.pedidos.find(p => p.id === event.id);
    if(pedido) {
      pedido.pago.estado = event.estado;
      pedido.fechaActualizacion = new Date();
      
      // Si el pago fue validado, cambiar estado del pedido
      if(event.estado === 'Validado') {
        pedido.estadoPedido = 'Pago Validado';
      } else if(event.estado === 'Rechazado') {
        pedido.estadoPedido = 'Cancelado';
      }
    }
  }
}