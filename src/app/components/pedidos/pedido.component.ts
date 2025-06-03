import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pedido {
  codigo: string;
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: Date;
  estado: string;
}

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent {
  pedidos: Pedido[] = [
    { codigo: 'PED001', cliente: 'Juan Pérez', producto: 'Zapatillas', cantidad: 2, fecha: new Date(), estado: 'Enviado' },
    { codigo: 'PED002', cliente: 'Ana Gómez', producto: 'Botines', cantidad: 1, fecha: new Date(), estado: 'Pendiente' }
  ];

  pedidosFiltrados: Pedido[] = [...this.pedidos];
  filtro = '';
  itemsPorPagina = 10;

  // Modal flags y modelos
  mostrarModalNuevo = false;
  mostrarModalVer = false;
  pedidoSeleccionado: Pedido | null = null;

  nuevoPedido: Pedido = {
    codigo: '',
    cliente: '',
    producto: '',
    cantidad: 1,
    fecha: new Date(),
    estado: 'Pendiente'
  };

  filtrarPedidos(): void {
    const f = this.filtro.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      Object.values(p).some(val => val.toString().toLowerCase().includes(f))
    );
  }

  abrirModalNuevo(): void {
    this.nuevoPedido = {
      codigo: `PED00${this.pedidos.length + 1}`,
      cliente: '',
      producto: '',
      cantidad: 1,
      fecha: new Date(),
      estado: 'Pendiente'
    };
    this.mostrarModalNuevo = true;
  }

  guardarNuevoPedido(): void {
    this.pedidos.push({ ...this.nuevoPedido });
    this.filtrarPedidos();
    this.mostrarModalNuevo = false;
  }

  verPedido(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarModalVer = true;
  }

  cerrarModal(): void {
    this.mostrarModalNuevo = false;
    this.mostrarModalVer = false;
  }
}
