import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../../services/venta.service';
import { VentaDetalleResponse } from '../../../models/venta-detalle-response.model';
import { NgxPaginationModule } from 'ngx-pagination';

// Se mantiene la interfaz para la lista principal
interface Venta {
  idVenta: number;
  tipoComprobante: string;
  numeroComprobante: string;
  total: number;
  fecha: string;
  estado: string;
  serie: string;
  clienteNombre?: string;
  formaPago?: string; // Se añade para el detalle
  totalIgv?: number;
  detalles?: any[];
}

@Component({
  selector: 'app-listado-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, DatePipe, DecimalPipe],
  templateUrl: './listado-venta.component.html',
  styleUrls: ['./listado-venta.component.css']
})
export class ListadoVentasComponent implements OnInit {

  // --- Propiedades para la Paginación y Datos ---
  ventas: Venta[] = []; // Lista original completa
  ventasFiltradas: Venta[] = []; // Lista que se muestra en la tabla
  paginaActual: number = 1;
  cantidadPorPagina: number = 10;

  // --- Propiedades para los Filtros ---
  textoBusqueda: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  // --- Propiedades para el Modal ---
  mostrarModalDetalle = false;
  ventaSeleccionadaParaDetalle: VentaDetalleResponse | null = null;

  // --- Propiedad para mostrar fecha en la versión oculta para imprimir ---
  now: Date = new Date();

  // --- Control de procesamiento de anulación (evita doble click) ---
  processingAnularId: number | null = null;

  constructor(private ventaService: VentaService, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
  this.ventaService.getVentas().subscribe({
    next: (data: Venta[]) => {
      // Normalizamos cada venta: forzamos totalIgv = 0 y recalculamos cada detalle sin IGV
      this.ventas = (data || []).map((v: Venta & any) => {
        const detallesRaw = (v.detalles || []) as any[];

        const detalles = detallesRaw.map((d: any) => {
          const cantidad = Number(d.cantidad ?? d.cant ?? 1);
          const precio = Number(d.precio ?? d.precioUnitario ?? d.precioVenta ?? 0);
          const total = +(cantidad * precio).toFixed(2);
          return {
            ...d,
            cantidad,
            precio,
            total,
            igv: 0, // forzamos IGV = 0
            nombreProducto: d.nombreProducto ?? d.nombre ?? d.descripcion ?? ''
          };
        });

        // Si backend ya devolvió total, lo mantenemos; si no, lo recalculamos desde detalles
        const totalFromBackend = Number((v as any).total ?? 0);
        const totalCalc: number = detalles.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);
        const totalFinal = totalFromBackend > 0 ? totalFromBackend : +totalCalc.toFixed(2);

        // Convertir la fecha a zona America/Lima para evitar desfase de +5h
return {
  ...v,
  detalles,
  totalIgv: 0, // forzamos totalIgv a 0
  total: totalFinal,
  fecha: (v as any).fecha ?? ''
};

      });

      this.ventasFiltradas = [...this.ventas];
    },
    error: (err) => {
      console.error('Error cargando ventas:', err);
      alert('Ocurrió un error al cargar el listado de ventas.');
    }
  });
}



  // --- LÓGICA DE FILTRADO Y BÚSQUEDA ---
  aplicarFiltros(): void {
    let ventasTemp = [...this.ventas]; // Copia de la lista original

    // 1. Filtro por texto de búsqueda
    if (this.textoBusqueda.trim() !== '') {
      const busqueda = this.textoBusqueda.toLowerCase();
      ventasTemp = ventasTemp.filter(venta =>
        (venta.clienteNombre?.toLowerCase().includes(busqueda) ?? false) ||
        (venta.tipoComprobante?.toLowerCase().includes(busqueda) ?? false) ||
        (venta.serie?.toLowerCase().includes(busqueda) ?? false) ||
        (venta.numeroComprobante?.toLowerCase().includes(busqueda) ?? false)
      );
    }

    // 2. Filtro por rango de fechas
    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio + 'T00:00:00');
      const fin = new Date(this.fechaFin + 'T23:59:59');
      
      ventasTemp = ventasTemp.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    }

    this.ventasFiltradas = ventasTemp;
    this.paginaActual = 1; // Resetear la paginación a la primera página
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.ventasFiltradas = [...this.ventas]; // Restaurar la lista completa
    this.paginaActual = 1;
  }

  // --- LÓGICA DEL MODAL ---
  verDetalle(venta: Venta): void {
  this.ventaService.getVentaById(venta.idVenta).subscribe({
    next: (detalleCompleto: VentaDetalleResponse | any) => {
      // Obtener detalles desde la respuesta (diversos nombres posibles)
      const detallesRaw = (detalleCompleto?.detalles ?? detalleCompleto?.detalleVenta ?? detalleCompleto?.items ?? []) as any[];

      const detalles = (detallesRaw || []).map((d: any) => {
        const cantidad = Number(d.cantidad ?? d.cant ?? 1);
        const precio = Number(d.precio ?? d.precioUnitario ?? d.precioVenta ?? 0);
        const total = +(cantidad * precio).toFixed(2);
        return {
          ...d,
          cantidad,
          precio,
          total,
          igv: 0,
          nombreProducto: d.nombreProducto ?? d.nombre ?? d.descripcion ?? ''
        };
      });

      // Recalcular total desde detalles (sin IGV)
      const totalCalc: number = detalles.reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);

      // Mezclamos info de la lista con la del detalle y forzamos totalIgv = 0
      // Normalizar y convertir fecha del detalle a zona America/Lima
this.ventaSeleccionadaParaDetalle = {
  ...venta,
  ...detalleCompleto,
  detalles,
  totalIgv: 0,
  total: detalleCompleto?.total ? Number(detalleCompleto.total) : +totalCalc.toFixed(2),
  fecha: detalleCompleto?.fecha ?? venta?.fecha ?? ''
} as any;


      this.mostrarModalDetalle = true;
    },
    error: (err) => {
      console.error('Error al cargar los detalles:', err);
      alert('No se pudieron cargar los detalles de la venta.');
    }
  });
}


  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.ventaSeleccionadaParaDetalle = null;
  }

  // --- LÓGICA DE IMPRESIÓN / DESCARGA PDF (CAPTURA DE TODAS LAS VENTAS) ---
  async imprimirListado(): Promise<void> {
    // Primero intentamos capturar el elemento oculto que contiene TODAS las ventas
    const fullListEl = document.getElementById('listado-para-imprimir-todo') as HTMLElement | null;
    const visibleContainer = document.querySelector('.listado-ventas-container') as HTMLElement | null;
    const targetEl = fullListEl ?? visibleContainer;

    if (!targetEl) {
      // Fallback: usar el print clásico si no encontramos nada
      this.renderer.addClass(document.body, 'imprimiendo-listado');
      window.print();
      this.renderer.removeClass(document.body, 'imprimiendo-listado');
      return;
    }

    try {
      this.renderer.addClass(document.body, 'imprimiendo-listado');

      // import dinámico y casteo a any para evitar problemas de tipos en TS
      const html2canvasModule = await import('html2canvas');
      const html2canvasFunc = (html2canvasModule as any).default ?? (html2canvasModule as any);

      const jspdfModule = await import('jspdf');
      const jsPDFConstructor = (jspdfModule as any).jsPDF ?? (jspdfModule as any).default ?? (jspdfModule as any);

      // Pequeño delay para que se apliquen estilos (si aplica)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Llamada segura a html2canvas (usando any)
      const canvas: HTMLCanvasElement = await html2canvasFunc(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDFConstructor('p', 'mm', 'a4') as any;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Obtener propiedades de la imagen (usa any para compatibilidad)
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidthMm = pdfWidth;
      const imgHeightMm = (imgProps.height * imgWidthMm) / imgProps.width;

      let heightLeft = imgHeightMm;
      let position = 0;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          if (heightLeft > 0) {
            pdf.addPage();
          }
        }
      }

      // En lugar de forzar descarga, creamos un blob y abrimos en iframe para lanzar diálogo de impresión
      const pdfBlob = pdf.output ? pdf.output('blob') : new Blob([], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);

      // Crear iframe oculto para imprimir automáticamente
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      document.body.appendChild(iframe);

      // Cuando el iframe cargue, intentamos abrir el diálogo de impresión
      iframe.onload = () => {
        try {
          const cw = iframe.contentWindow!;
          cw.focus();
          // Intento de imprimir automáticamente
          cw.print();
        } catch (e) {
          console.warn('No se pudo lanzar print automático desde iframe, se abrió la vista previa del PDF.', e);
          // Si falla, abrimos en nueva pestaña como fallback
          window.open(url, '_blank');
        } finally {
          // Liberar recursos después de unos segundos
          setTimeout(() => {
            try { document.body.removeChild(iframe); } catch {}
            try { URL.revokeObjectURL(url); } catch {}
          }, 2000);
        }
      };

    } catch (err) {
      console.error('Error generando PDF (fallback a print):', err);
      this.renderer.addClass(document.body, 'imprimiendo-listado');
      window.print();
    } finally {
      this.renderer.removeClass(document.body, 'imprimiendo-listado');
    }
  }

  // --- Método para imprimir SOLO el detalle (modal) ---
  imprimirDetalle(): void {
    // Aplica clase para estilos de impresión del modal y lanza print
    this.renderer.addClass(document.body, 'imprimiendo-detalle');
    window.print();
    this.renderer.removeClass(document.body, 'imprimiendo-detalle');
  }

  // --- Exportar a Excel (todas las ventas) ---
  async exportExcel(): Promise<void> {
    try {
      // Convertimos ventas a objeto simple para la hoja
      const data = this.ventas.map(v => ({
        Cliente: v.clienteNombre ?? 'N/A',
        Comprobante: v.tipoComprobante,
        Correlativo: `${v.serie ?? ''}-${v.numeroComprobante ?? ''}`,
        Monto: v.total,
        Fecha: v.fecha,
        Estado: v.estado
      }));

      const XLSX = await import('xlsx');
      const ws = (XLSX.utils as any).json_to_sheet(data);
      const wb = (XLSX.utils as any).book_new();
      (XLSX.utils as any).book_append_sheet(wb, ws, 'Ventas');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const fecha = new Date().toISOString().slice(0, 10);
      a.download = `ListadoVentas_Todas_${fecha}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      alert('No se pudo exportar a Excel. Revisa la consola.');
    }
  }

  // --- OTRAS ACCIONES ---
  /**
   * Anula una venta:
   * - pide confirmación al usuario
   * - llama a ventaService.anularVenta(id) si existe
   * - actualiza el estado localmente y maneja errores
   */
  anularVenta(venta: Venta): void {
    if (venta.estado === 'ANULADA') {
      alert('La venta ya está anulada.');
      return;
    }

    const confirmed = confirm(`¿Deseas anular la venta ${venta.serie}-${venta.numeroComprobante} de ${venta.clienteNombre || 'N/A'}?`);
    if (!confirmed) return;

    // Bloquear el botón para evitar doble envío
    this.processingAnularId = venta.idVenta;

    // Si el servicio tiene el método anularVenta, lo usamos; sino hacemos actualización local optimista
    if (typeof (this.ventaService as any).anularVenta === 'function') {
      (this.ventaService as any).anularVenta(venta.idVenta).subscribe({
        next: (resp: any) => {
          // Si la API devuelve la venta actualizada, úsala; sino marcamos localmente
          if (resp && resp.venta) {
            this._actualizarVentaLocal(resp.venta);
          } else {
            this._marcarVentaComoAnuladaLocal(venta.idVenta);
          }
          alert('Venta anulada correctamente.');
        },
        error: (err: any) => {
          console.error('Error anulando venta:', err);
          alert('Ocurrió un error al anular la venta. Revisa la consola.');
        },
        complete: () => {
          this.processingAnularId = null;
        }
      });
    } else {
      // Fallback: marcar localmente (si no tienes endpoint aún)
      this._marcarVentaComoAnuladaLocal(venta.idVenta);
      this.processingAnularId = null;
      alert('Venta marcada como anulada localmente (no se encontró método anularVenta en el servicio).');
    }
  }

  // --- Helpers para actualizar estado local ---
  private _marcarVentaComoAnuladaLocal(idVenta: number) {
    const idxAll = this.ventas.findIndex(v => v.idVenta === idVenta);
    if (idxAll !== -1) {
      this.ventas[idxAll] = { ...this.ventas[idxAll], estado: 'ANULADA' };
    }

    const idxFilt = this.ventasFiltradas.findIndex(v => v.idVenta === idVenta);
    if (idxFilt !== -1) {
      this.ventasFiltradas[idxFilt] = { ...this.ventasFiltradas[idxFilt], estado: 'ANULADA' };
    }

    if (this.ventaSeleccionadaParaDetalle && (this.ventaSeleccionadaParaDetalle as any).idVenta === idVenta) {
      (this.ventaSeleccionadaParaDetalle as any).estado = 'ANULADA';
    }
  }

  private _actualizarVentaLocal(ventaActualizada: any) {
    const idVenta = ventaActualizada.idVenta ?? ventaActualizada.id ?? ventaActualizada.idVenta;
    if (!idVenta) return;
    const idxAll = this.ventas.findIndex(v => v.idVenta === idVenta);
    if (idxAll !== -1) {
      this.ventas[idxAll] = { ...this.ventas[idxAll], ...ventaActualizada };
    }
    const idxFilt = this.ventasFiltradas.findIndex(v => v.idVenta === idVenta);
    if (idxFilt !== -1) {
      this.ventasFiltradas[idxFilt] = { ...this.ventasFiltradas[idxFilt], ...ventaActualizada };
    }
    if (this.ventaSeleccionadaParaDetalle && (this.ventaSeleccionadaParaDetalle as any).idVenta === idVenta) {
      this.ventaSeleccionadaParaDetalle = { ...this.ventaSeleccionadaParaDetalle, ...ventaActualizada } as any;
    }
  }
}
