import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../../services/inventario.service';
import { catchError } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';
import { InventarioResumenResponse } from '../../../models/inventario-resumen-response.model';

// librerías para PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// librería para Excel/CSV
import * as XLSX from 'xlsx';

// servicio de tallas por producto
import { TallaProductoService } from '../../../services/talla-producto.service';

@Component({
  selector: 'app-entrada-salida',
  templateUrl: './entrada-salida.component.html',
  styleUrls: ['./entrada-salida.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class EntradaSalidaComponent implements OnInit {

  inventarioResumen: InventarioResumenResponse[] = [];
  inventarioFiltrado: InventarioResumenResponse[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  textoBusqueda: string = '';

  /**
   * tallasMap guarda por clave un objeto con:
   *  - sizes: texto combinado "talla: 8/41/26 stock:1; talla: 9/42/27 stock:1; ..."
   *  - stocks: (se deja vacío porque ahora lo combinamos en sizes)
   */
  tallasMap: { [key: string]: { sizes: string, stocks: string } } = {};

  // ----- para modal de movimientos -----
  modalVisible: boolean = false;
  productoSeleccionado: any = null;
  movimientosSeleccionados: any[] = [];
  inicialInventarioTexto: string = 'N/A';

  constructor(
    private inventarioService: InventarioService,
    private tallaProductoService: TallaProductoService
  ) { }

  ngOnInit() {
    this.cargarInventario();
  }

  cargarInventario() {
    this.inventarioService.obtenerResumenInventario().pipe(
      catchError(error => {
        console.error('Error al obtener resumen de inventario:', error);
        return of([]);
      })
    ).subscribe(data => {
      this.inventarioResumen = data || [];

      // Guardar __key en cada item (mejor rendimiento en template)
      this.inventarioResumen.forEach(item => {
        (item as any).__key = this.keyForItem(item);
      });

      this.aplicarFiltro();
      this.paginaActual = 1;
      // Cargar tallas para los productos que se obtuvieron
      this.cargarTallasPorProductos();
    });
  }

  actualizarBusqueda(valor: string) {
    this.textoBusqueda = valor.toLowerCase();
    this.aplicarFiltro();
    this.paginaActual = 1;
  }

  actualizarRegistros(valor: string) {
    this.registrosPorPagina = parseInt(valor, 10);
    this.paginaActual = 1;
  }

  aplicarFiltro() {
    const txt = (this.textoBusqueda || '').trim().toLowerCase();
    if (!txt) {
      this.inventarioFiltrado = [...this.inventarioResumen];
    } else {
      this.inventarioFiltrado = this.inventarioResumen.filter(item =>
        (item.codigo || '').toLowerCase().includes(txt) ||
        (item.descripcion || '').toLowerCase().includes(txt)
      );
    }
    this.paginaActual = 1;
  }

  get inventarioPaginado() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.inventarioFiltrado.slice(inicio, inicio + this.registrosPorPagina);
  }
  
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual = pagina;
    }
  }
  
  totalPaginas(): number {
    return Math.ceil(this.inventarioFiltrado.length / this.registrosPorPagina);
  }

  // ---------------- TALLAS: helper + carga ----------------

  // PUBLIC para uso (aunque en plantilla usamos __key)
  public keyForItem(item: any): string {
    if (item == null) return '';
    const idProd = item.idProducto ?? item.id ?? item.productoId;
    return idProd !== undefined && idProd !== null ? String(idProd) : String(item.codigo ?? '');
  }

  /**
   * Dado un arreglo de tallas (cada una con usa/eur/cm/stock),
   * devuelve un objeto con:
   *  - sizes: "talla: 8/41/26 stock:1; talla: 9/42/27 stock:1; ..."
   */
  private splitTallasAndStocks(tallas: any[]): { sizes: string, stocks: string } {
    if (!tallas || tallas.length === 0) return { sizes: 'N/A', stocks: '' };

    const pares: string[] = tallas.map(t => {
      const usa = t.usa ?? t.usaSize ?? '';
      const eur = t.eur ?? t.eurSize ?? '';
      const cm = t.cm ?? t.cmSize ?? '';
      const stock = t.stock ?? t.cantidad ?? t.stockActual ?? 0;
      const medida = [usa, eur, cm].filter(x => x !== '' && x !== null && x !== undefined).join('/');
      const medidaTexto = medida ? medida : '(sin medida)';
      return `talla: ${medidaTexto} stock:${stock}`;
    });

    return {
      sizes: pares.join('; '),
      stocks: ''
    };
  }

  private cargarTallasPorProductos() {
    this.tallasMap = {};
    const uniqueKeys = Array.from(new Set(this.inventarioResumen.map(it => (it as any).__key).filter(k => k && k !== 'undefined' && k !== 'null')));

    const calls: Record<string, Observable<any[]>> = {};
    uniqueKeys.forEach(key => {
      const numeric = Number(key);
      if (!isNaN(numeric) && numeric > 0) {
        calls[key] = this.tallaProductoService.getTallasByProducto(numeric).pipe(
          catchError(err => {
            console.warn(`Error cargando tallas para producto ${numeric}:`, err);
            return of([]);
          })
        );
      } else {
        // si no es id numérico
        this.tallasMap[key] = { sizes: 'N/A', stocks: '' };
      }
    });

    if (Object.keys(calls).length === 0) {
      return;
    }

    forkJoin(calls).subscribe(results => {
      try {
        Object.keys(results).forEach(key => {
          const tallasArr = results[key] || [];
          this.tallasMap[key] = this.splitTallasAndStocks(tallasArr);
        });
      } catch (err) {
        console.error('Error procesando tallas por producto:', err);
      }
    }, err => {
      console.error('Error en forkJoin tallas:', err);
    });
  }

  // ----------------- EXPORT / IMPRESIÓN (usa tallasMap[key].sizes con el formato solicitado) -----------------

  generarPdfInventario() {
    try {
      const lista = (this.inventarioFiltrado && this.inventarioFiltrado.length > 0) ? this.inventarioFiltrado : this.inventarioResumen;
      const doc = new jsPDF('p', 'pt', 'a4');
      const title = 'Reporte Inventario';
      const fecha = new Date().toLocaleString();

      doc.setFontSize(14);
      doc.text(title, 40, 40);
      doc.setFontSize(10);
      doc.text(`Fecha: ${fecha}`, 40, 58);

      // Columnas: ahora tallas combinadas en 'Tallas disponibles' (se mantiene para export/pdfs)
      const columns = ['Código', 'Descripción', 'Ingresos', 'Salidas', 'Stock', 'Tallas disponibles'];
      const rows = lista.map(i => {
        const key = (i as any).__key ?? this.keyForItem(i);
        const tallasObj = this.tallasMap[key] ?? { sizes: 'N/A', stocks: '' };
        return [
          i.codigo ?? '',
          i.descripcion ?? '',
          String(i.ingresos ?? 0),
          String(i.salidas ?? 0),
          String(i.stock ?? 0),
          tallasObj.sizes
        ];
      });

      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 80,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [0, 150, 136], textColor: 255 },
        margin: { left: 40, right: 40 },
        columnStyles: {
          1: { cellWidth: 'auto' },
          5: { cellWidth: 200 } // ancho mayor para la columna combinada
        }
      });

      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 700;
      doc.setFontSize(10);
      doc.text(`Total productos: ${lista.length}`, 40, finalY + 20);

      const fileName = `reporte_inventario_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF. Revisa la consola para más detalles.');
    }
  }

  imprimirHtmlInventario() {
    try {
      const lista = (this.inventarioFiltrado && this.inventarioFiltrado.length > 0) ? this.inventarioFiltrado : this.inventarioResumen;
      if (!lista || lista.length === 0) {
        alert('No hay datos para imprimir.');
        return;
      }

      const styles = `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color:#222; }
          table { width:100%; border-collapse: collapse; margin-top:10px;}
          th, td { border: 1px solid #999; padding: 6px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background:#009688; color: white; }
          .header { display:flex; justify-content:space-between; align-items:center; }
          .title { font-size:18px; font-weight:bold; }
          .center { text-align:center; }
          .small { font-size:11px; color:#333; }
          @media print {
            .no-print { display:none; }
            th, td { font-size: 11px; }
          }
        </style>
      `;

      let htmlTabla = `<table><thead><tr><th>Código</th><th>Descripción</th><th class="center">Ingresos</th><th class="center">Salidas</th><th class="center">Stock</th><th>Tallas disponibles</th></tr></thead><tbody>`;
      for (const item of lista) {
        const key = (item as any).__key ?? this.keyForItem(item);
        const tallasObj = this.tallasMap[key] ?? { sizes: 'N/A', stocks: '' };
        htmlTabla += `<tr>
          <td>${item.codigo ?? ''}</td>
          <td>${item.descripcion ?? ''}</td>
          <td class="center">${item.ingresos ?? 0}</td>
          <td class="center">${item.salidas ?? 0}</td>
          <td class="center">${item.stock ?? 0}</td>
          <td class="small">${tallasObj.sizes}</td>
        </tr>`;
      }
      htmlTabla += `</tbody></table>`;

      const popup = window.open('', '_blank', 'width=1100,height=800');
      if (!popup) {
        alert('Bloqueador de ventanas emergentes impidió abrir la vista de impresión. Permite popups para este sitio.');
        return;
      }

      popup.document.write(`<html><head><title>Reporte Inventario</title>${styles}</head><body>`);
      popup.document.write(`<div class="header"><div class="title">Reporte Inventario</div><div>${new Date().toLocaleString()}</div></div>`);
      popup.document.write(htmlTabla);
      popup.document.write(`<div style="margin-top:20px"><button class="no-print" onclick="window.print();">Imprimir</button></div>`);
      popup.document.write('</body></html>');
      popup.document.close();

      setTimeout(() => {
        try { popup.focus(); } catch(e) {}
      }, 500);
    } catch (err) {
      console.error('Error preparando vista de impresión:', err);
      alert('Error al preparar la impresión. Revisa la consola para más detalles.');
    }
  }

  exportInventarioExcelCsv() {
    try {
      const listaRaw = (this.inventarioFiltrado && this.inventarioFiltrado.length > 0) ? this.inventarioFiltrado : this.inventarioResumen;
      if (!listaRaw || listaRaw.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      const lista = listaRaw.map(item => {
        const key = (item as any).__key ?? this.keyForItem(item);
        const tallasObj = this.tallasMap[key] ?? { sizes: 'N/A', stocks: '' };
        return {
          Código: item.codigo ?? '',
          Descripción: item.descripcion ?? '',
          Ingresos: item.ingresos ?? 0,
          Salidas: item.salidas ?? 0,
          Stock: item.stock ?? 0,
          'Tallas disponibles': tallasObj.sizes
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(lista, { header: ['Código', 'Descripción', 'Ingresos', 'Salidas', 'Stock', 'Tallas disponibles'] });
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      const date = new Date().toISOString().slice(0,10);
      const fileNameXlsx = `reporte_inventario_${date}.xlsx`;
      XLSX.writeFile(wb, fileNameXlsx);

      // CSV
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const fileNameCsv = `reporte_inventario_${date}.csv`;

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', fileNameCsv);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exportando Excel/CSV:', err);
      alert('Error al exportar Excel/CSV. Revisa la consola para más detalles.');
    }
  }

  // ----------------- NUEVAS FUNCIONES: Modal Movimientos + Impresión por producto -----------------

  // intenta obtener movimientos del servicio si existe; si no, retorna fallback con info disponible
  private getMovimientosForProducto(producto: any): Promise<any[]> {
    const id = producto.idProducto ?? producto.id ?? producto.productoId ?? (isNaN(Number(producto.codigo)) ? null : Number(producto.codigo));
    const svcAny = this.inventarioService as any;
    const candidateMethodNames = [
      'obtenerMovimientosPorProducto',
      'obtenerMovimientosProducto',
      'getMovimientosByProducto',
      'getMovimientosProducto'
    ];

    for (const m of candidateMethodNames) {
      if (typeof svcAny[m] === 'function') {
        try {
          return new Promise((resolve) => {
            (svcAny[m](id)).pipe(
              catchError(err => {
                console.warn(`Error llamando ${m} para id ${id}:`, err);
                return of([]);
              })
            ).subscribe((res: any) => {
              resolve(res || []);
            });
          });
        } catch (err) {
          console.warn(`Excepción al llamar ${m}:`, err);
        }
      }
    }

    // fallback: construir movimientos simples a partir del resumen
    return Promise.resolve(this.buildFallbackMovimientos(producto));
  }

  private buildFallbackMovimientos(producto: any): any[] {
    const movs: any[] = [];

    // Intentamos deducir un "inventario inicial" si hay stock/ingresos
    if (producto.ingresos || producto.salidas) {
      movs.push({
        comprobante: producto.codigo ?? '-',
        concepto: 'INVENTARIO INICIAL',
        fecha: new Date().toLocaleDateString(),
        ingresos: producto.ingresos ?? 0,
        salidas: 0
      });

      if ((producto.ingresos ?? 0) > 0) {
        movs.push({
          comprobante: '-',
          concepto: 'INGRESO DIRECTO',
          fecha: new Date().toLocaleDateString(),
          ingresos: producto.ingresos ?? 0,
          salidas: 0
        });
      }
      if ((producto.salidas ?? 0) > 0) {
        movs.push({
          comprobante: '-',
          concepto: 'SALIDA',
          fecha: new Date().toLocaleDateString(),
          ingresos: 0,
          salidas: producto.salidas ?? 0
        });
      }
    } else {
      movs.push({
        comprobante: producto.codigo ?? '-',
        concepto: 'INVENTARIO INICIAL',
        fecha: new Date().toLocaleDateString(),
        ingresos: producto.stock ?? 0,
        salidas: 0
      });
    }

    return movs;
  }

  abrirModalMovimientos(producto: any) {
    // establecer producto y mostrar modal inmediatamente
    this.productoSeleccionado = producto;
    this.movimientosSeleccionados = [];
    this.inicialInventarioTexto = 'Cargando...';
    this.modalVisible = true;

    // cargar movimientos (puede tardar)
    this.getMovimientosForProducto(producto).then(movs => {
      this.movimientosSeleccionados = movs || [];
      const inicial = this.movimientosSeleccionados.find(m => (m.concepto || '').toString().toUpperCase().includes('INVENTARIO'));
      if (inicial) {
        const val = (inicial.ingresos ?? inicial.stock ?? inicial.cantidad ?? 0);
        this.inicialInventarioTexto = String(val);
      } else {
        this.inicialInventarioTexto = String(this.productoSeleccionado?.stock ?? 'N/A');
      }
    }).catch(err => {
      console.error('Error obteniendo movimientos para modal:', err);
      this.movimientosSeleccionados = this.buildFallbackMovimientos(producto);
      this.inicialInventarioTexto = String(this.productoSeleccionado?.stock ?? 'N/A');
    });
  }

  cerrarModal() {
    this.modalVisible = false;
    this.productoSeleccionado = null;
    this.movimientosSeleccionados = [];
    this.inicialInventarioTexto = 'N/A';
  }

  // imprimir el contenido del modal para el producto (usa la misma info que el modal)
  imprimirMovimientosProducto(producto: any) {
    this.getMovimientosForProducto(producto).then(movs => {
      const movimientos = movs || this.buildFallbackMovimientos(producto);
      const productoNombre = producto.descripcion ?? producto.codigo ?? 'Producto';
      const fechaStr = new Date().toLocaleString();

      const styles = `
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color:#222; }
          table { width:100%; border-collapse: collapse; margin-top:10px;}
          th, td { border: 1px solid #999; padding: 6px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background:#009688; color: white; }
          .header { display:flex; justify-content:space-between; align-items:center; }
          .title { font-size:18px; font-weight:bold; }
          .small { font-size:11px; color:#333; }
        </style>
      `;

      let html = `<div class="header"><div class="title">Movimientos del Producto</div><div>${fechaStr}</div></div>`;
      html += `<div style="margin-top:8px"><strong>Producto:</strong> ${productoNombre}</div>`;
      const inicial = movimientos.find(m => (m.concepto || '').toString().toUpperCase().includes('INVENTARIO'));
      const inicialValor = inicial ? (inicial.ingresos ?? inicial.stock ?? 0) : (producto.stock ?? 'N/A');
      html += `<div style="margin-top:6px"><strong>Inventario inicial:</strong> ${inicialValor}</div>`;

      html += `<table><thead><tr><th>Comprobante</th><th>Concepto</th><th>Fecha</th><th>Ingresos</th><th>Salidas</th></tr></thead><tbody>`;
      let totalIngresos = 0;
      let totalSalidas = 0;
      for (const m of movimientos) {
        html += `<tr>
          <td>${m.comprobante ?? '-'}</td>
          <td>${m.concepto ?? '-'}</td>
          <td>${m.fecha ?? ''}</td>
          <td style="text-align:right">${m.ingresos ?? 0}</td>
          <td style="text-align:right">${m.salidas ?? 0}</td>
        </tr>`;
        totalIngresos += Number(m.ingresos ?? 0);
        totalSalidas += Number(m.salidas ?? 0);
      }
      html += `</tbody></table>`;
      html += `<div style="margin-top:10px"><strong>Total Ingresos:</strong> ${totalIngresos} &nbsp;&nbsp; <strong>Total Salidas:</strong> ${totalSalidas}</div>`;

      const popup = window.open('', '_blank', 'width=900,height=700');
      if (!popup) {
        alert('Bloqueador de ventanas emergentes impidió abrir la vista de impresión. Permite popups para este sitio.');
        return;
      }
      popup.document.write(`<html><head><title>Movimientos ${productoNombre}</title>${styles}</head><body>`);
      popup.document.write(html);
      popup.document.write(`<div style="margin-top:20px"><button onclick="window.print();">Imprimir</button></div>`);
      popup.document.write('</body></html>');
      popup.document.close();
      setTimeout(() => { try { popup.focus(); } catch(e) {} }, 300);
    }).catch(err => {
      console.error('Error imprimiendo movimientos del producto:', err);
      alert('Error al preparar la impresión del producto. Revisa la consola.');
    });
  }

  // Métodos para sumar ingresos/salidas (evitar funciones flecha en template)
  totalIngresos(movs: any[] | null | undefined): number {
    if (!movs || movs.length === 0) return 0;
    return movs.reduce((sum, it) => sum + Number(it?.ingresos ?? 0), 0);
  }

  totalSalidas(movs: any[] | null | undefined): number {
    if (!movs || movs.length === 0) return 0;
    return movs.reduce((sum, it) => sum + Number(it?.salidas ?? 0), 0);
  }

  // ----------------- EXPORTS / fin -----------------

  // Método para filtrar por producto y fecha (Opcional)
}
