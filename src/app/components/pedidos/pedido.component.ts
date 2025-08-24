// src/app/components/pedido/pedido.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido.model';
import { DetallePedidoComponent } from './detalles_pedidos/detalle-pedido.component';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

type EstadoPedido = 
  | 'Pendiente Validación'
  | 'Pago Validado'
  | 'En Preparación'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    DetallePedidoComponent
  ],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent implements OnInit {
  pedidos: Pedido[] = [];
  page = 1;
  pageSize = 10;
  pedidoSeleccionado: Pedido | null = null;
  mostrarDetalle = false;
  
  estados: EstadoPedido[] = [
    'Pendiente Validación',
    'Pago Validado',
    'En Preparación',
    'Enviado',
    'Entregado',
    'Cancelado'
  ];

  constructor(private pedidoSvc: PedidoService) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.pedidoSvc.getPedidos().subscribe({
      next: data => {
        // Filtrar los datos para mostrar solo pedidos móviles
        this.pedidos = data.filter(pedido => pedido.tipoComprobante === '01');
      },
      error: err => console.error('Error cargando pedidos', err)
    });
  }

  verDetalle(p: Pedido) {
    this.pedidoSvc.getDetallePedido(p.idVenta).subscribe({
      next: detalle => {
        this.pedidoSeleccionado = detalle;
        this.mostrarDetalle = true;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Status:', err.status);
        console.error('Body:', err.error);
        console.error('Complete error:', err);
      }
    });
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.pedidoSeleccionado = null;
  }

  async eliminarPedido(p: Pedido) {
    const noEliminar = ['Pago Validado', 'En Preparación', 'Enviado', 'Entregado'];
    if (noEliminar.includes(p.estado as EstadoPedido)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Este pedido ya está en proceso de envío y no puede ser eliminado.',
        confirmButtonColor: '#00bcd4'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el pedido #${p.idVenta}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.pedidoSvc.eliminarPedido(p.idVenta).subscribe({
        next: () => {
          this.pedidos = this.pedidos.filter(x => x.idVenta !== p.idVenta);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Pedido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: err => {
          console.error('Error eliminando', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el pedido.',
            confirmButtonColor: '#00bcd4'
          });
        }
      });
    }
  }

  async cambiarEstadoPedido(p: Pedido, e: Event) {
    const nuevo = (e.target as HTMLSelectElement).value as EstadoPedido;
    
    // Si el estado es el mismo, no hacer nada
    if (p.estado === nuevo) return;
    
    const result = await Swal.fire({
      title: 'Confirmar cambio',
      text: `¿Estás seguro de cambiar el estado del pedido #${p.idVenta} de "${p.estado}" a "${nuevo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.pedidoSvc.cambiarEstado(p.idVenta, nuevo).subscribe({
        next: () => {
          p.estado = nuevo;
          Swal.fire({
            icon: 'success',
            title: 'Estado cambiado',
            text: `Estado del pedido cambiado a "${nuevo}" correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: err => {
          console.error('Error cambiando estado', err);
          // Revertir el cambio en el select
          (e.target as HTMLSelectElement).value = p.estado;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cambiar el estado del pedido.',
            confirmButtonColor: '#00bcd4'
          });
        }
      });
    } else {
      // Revertir el cambio en el select si se cancela
      (e.target as HTMLSelectElement).value = p.estado;
    }
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}