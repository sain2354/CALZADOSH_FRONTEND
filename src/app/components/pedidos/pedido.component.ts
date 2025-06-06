import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface Pedido {
  codigo: string;
  cliente: string;
  producto: string;
  talla?: string;
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
    { codigo: 'PED001', cliente: 'Juan Pérez', producto: 'Zapatillas deportivas', talla: '42', cantidad: 2, fecha: new Date(), estado: 'Enviado' },
    { codigo: 'PED002', cliente: 'Ana Gómez', producto: 'Botines', talla: '40', cantidad: 1, fecha: new Date(), estado: 'Pendiente' },
    { codigo: 'PED003', cliente: 'Carlos Ruiz', producto: 'Zapatos formales', talla: '43', cantidad: 3, fecha: new Date(), estado: 'Entregado' },
    { codigo: 'PED004', cliente: 'María López', producto: 'Macosines', talla: '40', cantidad: 1, fecha: new Date(), estado: 'Pendiente' },
    { codigo: 'PED005', cliente: 'Luis García', producto: 'Sandalias', talla: '42', cantidad: 1, fecha: new Date(), estado: 'Enviado' },
  ];

  pedidosFiltrados: Pedido[] = [...this.pedidos];
  pedidosPaginados: Pedido[] = [];
  filtro = '';
  itemsPorPagina = 5;
  paginaActual = 1;
  totalPaginas = 1;
  inicioItem = 0;
  finItem = 0;
  paginasMostrar: number[] = [];
  resumenEstados: any[] = [];
  
  mostrarModalNuevo = false;
  mostrarModalVer = false;
  mostrarModalEditar = false;
  mostrarMenuExportar = false;
  pedidoSeleccionado: Pedido | null = null;

  nuevoPedido: Pedido = {
    codigo: '',
    cliente: '',
    producto: '',
    talla: '',
    cantidad: 1,
    fecha: new Date(),
    estado: 'Pendiente'
  };

  constructor() {
    this.actualizarResumenEstados();
    this.filtrarYActualizarPagina();
  }

  actualizarResumenEstados() {
    this.resumenEstados = [
      { estado: 'Pendiente', cantidad: this.pedidos.filter(p => p.estado === 'Pendiente').length, icono: '🕒' },
      { estado: 'Enviado', cantidad: this.pedidos.filter(p => p.estado === 'Enviado').length, icono: '🚚' },
      { estado: 'Entregado', cantidad: this.pedidos.filter(p => p.estado === 'Entregado').length, icono: '📦' }
    ];
  }

  filtrarPedidos(): void {
    const f = this.filtro.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      Object.values(p).some(val => val?.toString().toLowerCase().includes(f))
    );
    this.paginaActual = 1;
    this.filtrarYActualizarPagina();
  }

  cambiarItemsPorPagina(): void {
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

  abrirModalNuevo(): void {
    this.nuevoPedido = {
      codigo: `PED00${this.pedidos.length + 1}`,
      cliente: '',
      producto: '',
      talla: '',
      cantidad: 1,
      fecha: new Date(),
      estado: 'Pendiente'
    };
    this.mostrarModalNuevo = true;
  }

  guardarNuevoPedido(): void {
    this.pedidos.push({ ...this.nuevoPedido });
    this.filtrarPedidos();
    this.actualizarResumenEstados();
    this.mostrarModalNuevo = false;
  }

  verPedido(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.mostrarModalVer = true;
  }

  abrirModalEditar(pedido: Pedido): void {
    this.pedidoSeleccionado = { ...pedido };
    this.mostrarModalEditar = true;
  }

  guardarEdicion(): void {
    const index = this.pedidos.findIndex(p => p.codigo === this.pedidoSeleccionado?.codigo);
    if (index !== -1 && this.pedidoSeleccionado) {
      this.pedidos[index].estado = this.pedidoSeleccionado.estado;
      this.filtrarPedidos();
      this.actualizarResumenEstados();
    }
    this.mostrarModalEditar = false;
  }

  eliminarPedido(pedido: Pedido): void {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      this.pedidos = this.pedidos.filter(p => p.codigo !== pedido.codigo);
      this.filtrarPedidos();
      this.actualizarResumenEstados();
    }
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
      case 'SVG':
        this.exportarSVG();
        break;
    }
  }

  exportarExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.pedidosFiltrados);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, 'pedidos.xlsx');
  }

  exportarPDF(): void {
    const doc = new jsPDF();
    const title = 'Listado de Pedidos';
    const headers = [['Código', 'Cliente', 'Producto', 'Talla', 'Cantidad', 'Fecha', 'Estado']];
    
    const data = this.pedidosFiltrados.map(pedido => [
      pedido.codigo,
      pedido.cliente,
      pedido.producto,
      pedido.talla || '',
      pedido.cantidad.toString(),
      new Date(pedido.fecha).toLocaleDateString(),
      pedido.estado
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

  exportarSVG(): void {
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
    this.mostrarModalNuevo = false;
    this.mostrarModalVer = false;
    this.mostrarModalEditar = false;
    this.mostrarMenuExportar = false;
  }
}