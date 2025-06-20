import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

type EstadoPedido = 'EnPreparacion' | 'Enviado' | 'Entregado';
type EstadoPago = 'PendienteValidacion' | 'Pagado' | 'Rechazado';
type MetodoPago = 'Yape' | 'Plin' | 'Manual';

interface ProductoPedido {
  id: string;
  nombre: string;
  imagen: string;
  talla?: string;
  precioUnitario: number;
  cantidad: number;
}

interface DireccionEnvio {
  calle: string;
  ciudad: string;
  departamento: string;
  referencia: string;
  codigoPostal?: string;
}

interface Pago {
  metodo: MetodoPago;
  estado: EstadoPago;
  comprobante?: string;
  idTransaccion?: string;
  fechaValidacion?: Date;
  validadoPor?: string;
  motivoRechazo?: string;
}

interface EstadoHistorico {
  estado: string;
  fecha: Date;
  usuario?: string;
  comentario?: string;
}

interface Pedido {
  id: string;
  cliente: string;
  clienteId: string;
  productos: ProductoPedido[];
  direccion: DireccionEnvio;
  pago: Pago;
  estadoPedido: EstadoPedido;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  historialEstados: EstadoHistorico[];
  costoEnvio: number;
  descuento: number;
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
    {
      id: 'PED001',
      cliente: 'Juan Pérez',
      clienteId: 'USR001',
      productos: [
        {
          id: 'PROD01',
          nombre: 'Zapatillas deportivas',
          imagen: 'https://example.com/zapatillas.jpg',
          talla: '42',
          precioUnitario: 120.00,
          cantidad: 2
        }
      ],
      direccion: {
        calle: 'Av. Lima 123',
        ciudad: 'Lima',
        departamento: 'Lima',
        referencia: 'Frente al parque'
      },
      pago: {
        metodo: 'Yape',
        estado: 'Pagado',
        comprobante: 'data:image/png;base64,...',
        idTransaccion: 'TRANS001'
      },
      estadoPedido: 'Enviado',
      fechaCreacion: new Date('2023-05-15T10:30:00'),
      fechaActualizacion: new Date('2023-05-16T09:15:00'),
      historialEstados: [
        {
          estado: 'PendienteValidacion',
          fecha: new Date('2023-05-15T10:30:00'),
          usuario: 'Sistema',
          comentario: 'Pedido creado'
        },
        {
          estado: 'Pagado',
          fecha: new Date('2023-05-15T14:45:00'),
          usuario: 'Admin',
          comentario: 'Pago validado'
        },
        {
          estado: 'EnPreparacion',
          fecha: new Date('2023-05-15T16:20:00'),
          usuario: 'Sistema',
          comentario: 'Preparando pedido'
        },
        {
          estado: 'Enviado',
          fecha: new Date('2023-05-16T09:15:00'),
          usuario: 'Admin',
          comentario: 'Pedido despachado'
        }
      ],
      costoEnvio: 15.00,
      descuento: 10.00
    }
  ];

  pedidosFiltrados: Pedido[] = [...this.pedidos];
  pedidosPaginados: Pedido[] = [];
  filtro = '';
  itemsPorPagina = 10;
  paginaActual = 1;
  totalPaginas = 1;
  inicioItem = 0;
  finItem = 0;
  paginasMostrar: number[] = [];
  filtros = {
    estadoPago: '' as EstadoPago | '',
    estadoPedido: '' as EstadoPedido | '',
    metodoPago: '' as MetodoPago | '',
    fechaDesde: '',
    fechaHasta: '',
    cliente: ''
  };
  mostrarModalDetalle = false;
  mostrarModalValidar = false;
  mostrarModalRechazar = false;
  mostrarMenuExportar = false;
  pedidoSeleccionado: Pedido | null = null;
  motivoRechazo = '';
  estadosPago: EstadoPago[] = ['PendienteValidacion', 'Pagado', 'Rechazado'];
  estadosPedido: EstadoPedido[] = ['EnPreparacion', 'Enviado', 'Entregado'];
  metodosPago: MetodoPago[] = ['Yape', 'Plin', 'Manual'];

  constructor() {
    this.filtrarYActualizarPagina();
  }

  cambiarItemsPorPagina(): void {
    this.paginaActual = 1;
    this.filtrarYActualizarPagina();
  }

  calcularTotalProductos(pedido: Pedido): number {
    return pedido.productos.reduce((total, producto) => 
      total + (producto.precioUnitario * producto.cantidad), 0);
  }

  calcularTotalVenta(pedido: Pedido): number {
    return this.calcularTotalProductos(pedido) + pedido.costoEnvio - pedido.descuento;
  }

  aplicarFiltros(): void {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      const cumpleEstadoPago = !this.filtros.estadoPago || 
                             pedido.pago.estado === this.filtros.estadoPago;
      const cumpleEstadoPedido = !this.filtros.estadoPedido || 
                               pedido.estadoPedido === this.filtros.estadoPedido;
      const cumpleMetodoPago = !this.filtros.metodoPago || 
                              pedido.pago.metodo === this.filtros.metodoPago;
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
      
      return cumpleEstadoPago && cumpleEstadoPedido && cumpleMetodoPago && 
             cumpleCliente && cumpleFecha;
    });
    
    this.paginaActual = 1;
    this.filtrarYActualizarPagina();
  }

  filtrarYActualizarPagina(): void {
    this.totalPaginas = Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina);
    this.inicioItem = (this.paginaActual - 1) * this.itemsPorPagina + 1;
    this.finItem = Math.min(this.paginaActual * this.itemsPorPagina, this.pedidosFiltrados.length);
    
    this.pedidosPaginados = this.pedidosFiltrados.slice(
      (this.paginaActual - 1) * this.itemsPorPagina,
      this.paginaActual * this.itemsPorPagina
    );
    
    this.actualizarPaginasMostrar();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.filtrarYActualizarPagina();
    }
  }

  actualizarPaginasMostrar(): void {
    const paginas: number[] = [];
    const paginasVisibles = 5;
    
    let inicio = Math.max(1, this.paginaActual - Math.floor(paginasVisibles / 2));
    let fin = Math.min(this.totalPaginas, inicio + paginasVisibles - 1);
    
    if (fin - inicio + 1 < paginasVisibles) {
      inicio = Math.max(1, fin - paginasVisibles + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    this.paginasMostrar = paginas;
  }

  verDetalle(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.mostrarModalDetalle = true;
  }

  abrirModalValidar(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.mostrarModalValidar = true;
  }

  abrirModalRechazar(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.motivoRechazo = '';
    this.mostrarModalRechazar = true;
  }

  verComprobante(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.mostrarModalDetalle = true;
  }

  validarPago(aprobado: boolean): void {
    if (!this.pedidoSeleccionado) return;

    if (aprobado) {
      this.pedidoSeleccionado.pago.estado = 'Pagado';
      this.pedidoSeleccionado.estadoPedido = 'EnPreparacion';
      this.pedidoSeleccionado.pago.fechaValidacion = new Date();
      this.pedidoSeleccionado.pago.validadoPor = 'Admin';
      this.agregarHistorial(
        this.pedidoSeleccionado, 
        'Pago validado', 
        'Admin'
      );
    } else {
      this.pedidoSeleccionado.pago.estado = 'Rechazado';
      this.pedidoSeleccionado.pago.motivoRechazo = this.motivoRechazo;
      this.agregarHistorial(
        this.pedidoSeleccionado, 
        `Pago rechazado: ${this.motivoRechazo}`, 
        'Admin'
      );
    }

    this.pedidoSeleccionado.fechaActualizacion = new Date();
    
    const index = this.pedidos.findIndex(p => p.id === this.pedidoSeleccionado?.id);
    if (index !== -1) {
      this.pedidos[index] = this.pedidoSeleccionado;
    }
    
    this.aplicarFiltros();
    this.cerrarModal();
  }

  cambiarEstadoPedido(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    pedido.estadoPedido = nuevoEstado;
    pedido.fechaActualizacion = new Date();
    this.agregarHistorial(
      pedido, 
      `Estado cambiado a ${nuevoEstado}`, 
      'Admin'
    );
    
    const index = this.pedidos.findIndex(p => p.id === pedido.id);
    if (index !== -1) {
      this.pedidos[index] = pedido;
    }
    
    this.aplicarFiltros();
  }

  eliminarPedido(pedido: Pedido): void {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
      this.aplicarFiltros();
    }
  }

  private agregarHistorial(pedido: Pedido, comentario: string, usuario: string): void {
    pedido.historialEstados.push({
      estado: pedido.estadoPedido,
      fecha: new Date(),
      usuario,
      comentario
    });
  }

  exportarTabla(formato: string): void {
    this.mostrarMenuExportar = false;
    
    switch(formato) {
      case 'Excel':
        this.exportarExcel();
        break;
      case 'PDF':
        this.exportarPDF();
        break;
      case 'Imagen':
        this.exportarImagen();
        break;
    }
  }

  exportarExcel(): void {
    const data = this.pedidosFiltrados.map(pedido => ({
      'ID': pedido.id,
      'Cliente': pedido.cliente,
      'Total Productos': this.calcularTotalProductos(pedido),
      'Costo Envío': pedido.costoEnvio,
      'Descuento': pedido.descuento,
      'Total Venta': this.calcularTotalVenta(pedido),
      'Método Pago': pedido.pago.metodo,
      'Estado Pago': pedido.pago.estado,
      'Estado Pedido': pedido.estadoPedido,
      'Fecha Creación': pedido.fechaCreacion,
      'Última Actualización': pedido.fechaActualizacion
    }));
    
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, 'pedidos.xlsx');
  }

  exportarPDF(): void {
    const doc = new jsPDF();
    const title = 'Listado de Pedidos';
    const headers = [
      ['ID', 'Cliente', 'Total', 'Estado Pago', 'Estado Pedido', 'Fecha']
    ];
    
    const data = this.pedidosFiltrados.map(pedido => [
      pedido.id,
      pedido.cliente,
      `S/ ${this.calcularTotalVenta(pedido).toFixed(2)}`,
      pedido.pago.estado,
      pedido.estadoPedido,
      new Date(pedido.fechaCreacion).toLocaleDateString()
    ]);
    
    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 20,
      headStyles: {
        fillColor: [0, 188, 212],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 30 }
    });
    
    doc.text(title, 14, 15);
    doc.save('pedidos.pdf');
  }

  exportarImagen(): void {
    const element = document.getElementById('tablaPedidos');
    if (element) {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'pedidos.png';
        link.href = imgData;
        link.click();
      });
    }
  }

  abrirMenuExportar(): void {
    this.mostrarMenuExportar = !this.mostrarMenuExportar;
  }

  cerrarModal(): void {
    this.mostrarModalDetalle = false;
    this.mostrarModalValidar = false;
    this.mostrarModalRechazar = false;
    this.pedidoSeleccionado = null;
  }

  limpiarFiltros(): void {
    this.filtros = {
      estadoPago: '',
      estadoPedido: '',
      metodoPago: '',
      fechaDesde: '',
      fechaHasta: '',
      cliente: ''
    };
    this.aplicarFiltros();
  }
}