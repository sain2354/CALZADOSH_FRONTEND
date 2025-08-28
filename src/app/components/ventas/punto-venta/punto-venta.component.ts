// punto-venta.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductoService } from '../../../services/producto.service';
import { VentaService } from '../../../services/venta.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { PersonaService } from '../../../services/persona.service';
import { PersonaComponent } from '../../persona/nuevo-persona/persona.component';
import { Persona } from '../../../models/persona.model';
import { BoletaVentaComponent } from '../../../boleta-venta/boleta-venta.component';

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule,
    PersonaComponent,
    BoletaVentaComponent,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './punto-venta.component.html',
  styleUrls: ['./punto-venta.component.css']
})
export class PuntoVentaComponent implements OnInit {
  // AUTOCOMPLETE
  keyword = 'nombre';
  allProducts: any[] = [];
  productosAutoComplete: any[] = [];
  productoBuscado = '';

  // ITEMS
  ventaItems: Array<{
    item: number;
    idProducto: number;
    codigo: string;
    nombre: string;
    cantidad: number;
    precio: number;
    talla?: string;
    stock?: number;
    idUnidadMedida?: number;
  }> = [];
  currentItemIndex: number | null = null;

  // MODALES
  mostrarModalTallas = false;
  tallasProducto: any[] = [];
  mostrarModalCliente = false;

  // CONFIRMACIÓN
  mostrarConfirmacion = false;
  ventaCreadaResponse: any = null;

  // TOTALES
  subTotal = 0;
  iva = 0;
  descuento = 0;
  total = 0;

  // DATOS VENTA
  documentoSeleccionado = '';
  personas: Persona[] = [];
  clienteSeleccionado = '';
  mediosPago = ['Yape', 'Plin', 'Transferencia Bancaria'];
  tipoPagoSeleccionado = '';
  serie = '';
  correlativo = '00000001';

  montoEfectivo = 0;
  efectivoExacto = false; // Nueva propiedad para el checkbox

  get vuelto() {
    return +(this.montoEfectivo - this.total).toFixed(2);
  }

  // Getter para el componente de boleta
  get boleta() {
    if (!this.ventaCreadaResponse) return null;
    const vr = this.ventaCreadaResponse;
    return {
      serie: vr.serie,
      numeroComprobante: vr.numeroComprobante,
      fecha: vr.fecha,
      clienteNombre: vr.clienteNombre,
      clienteDocumento: vr.clienteDocumento,
      direccion: vr.direccion,
      moneda: 'Gs/',
      detalles: (vr.detalles ?? []).map((d: any) => ({
        cantidad: d.cantidad,
        descripcion: d.descripcion,
        precio: d.precio,
        descuento: d.descuento,
        total: d.total
      }))
    };
  }

  @ViewChild('reporteBoletaContainer', { static: false, read: ElementRef })
  reporteBoletaContainer!: ElementRef;

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService,
    private tallaProductoService: TallaProductoService,
    private personaService: PersonaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarPersonas();
    // Inicializa el correlativo si hay un documento seleccionado por defecto
    this.actualizarCorrelativoDesdeStorage();
  }

  private cargarProductos() {
    this.productoService.getAll().subscribe({
      next: data => {
        this.allProducts = data.map(p => ({
          idProducto: p.idProducto,
          codigo: p.codigoBarra,
          nombre: p.nombre,
          precio: p.precioVenta,
          stock: p.stock
        }));
        this.productosAutoComplete = [...this.allProducts];
        this.ventaItems.forEach(it => {
          const prod = this.allProducts.find(p => p.idProducto === it.idProducto);
          if (prod) it.stock = prod.stock;
        });
      },
      error: err => console.error(err)
    });
  }

  private cargarPersonas() {
    this.personaService.getAllPersonas().subscribe({
      next: p => (this.personas = p),
      error: err => console.error(err)
    });
  }

  onChangeSearch(search: string) {
    this.productoBuscado = search;
    this.productosAutoComplete = search
      ? this.allProducts.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
      : [...this.allProducts];
  }
  onFocused(_: any) {}

  selectEvent(item: any) {
    this.ventaItems.push({
      item: this.ventaItems.length + 1,
      idProducto: item.idProducto,
      codigo: item.codigo,
      nombre: item.nombre,
      cantidad: 1,
      precio: item.precio,
      stock: item.stock
    });
    this.productoBuscado = '';
    this.calcularTotal();
  }

  cambiarCantidad(i: number, q: number) {
    if (q > 0) {
      this.ventaItems[i].cantidad = q;
      this.calcularTotal();
    }
  }

  eliminarItem(i: number) {
    this.ventaItems.splice(i, 1);
    this.ventaItems.forEach((it, idx) => (it.item = idx + 1));
    this.calcularTotal();
  }

  vaciarListado() {
    this.ventaItems = [];
    this.subTotal = this.iva = this.descuento = this.total = 0;
  }

  private calcularTotal() {
    this.total = +this.ventaItems.reduce((acc, it) => acc + it.cantidad * it.precio, 0).toFixed(2);
    this.subTotal = +(this.total / 1.18).toFixed(2);
    this.iva = +(this.subTotal * 0.18).toFixed(2);
    this.total = +(this.total - this.descuento).toFixed(2);
    
    // Si el checkbox está marcado, actualizar el monto de efectivo
    if (this.efectivoExacto) {
      this.montoEfectivo = this.total;
    }
  }

  onDocumentoChange() {
    if (this.documentoSeleccionado === 'Boleta') {
      this.serie = 'B001';
    } else if (this.documentoSeleccionado === 'Factura') {
      this.serie = 'F001';
    } else {
      this.serie = '';
      this.correlativo = '00000001';
      return;
    }
    // Actualiza el correlativo basado en el tipo de documento seleccionado
    this.actualizarCorrelativoDesdeStorage();
  }

  /**
   * Obtiene el siguiente correlativo para la serie actual desde localStorage
   */
  private actualizarCorrelativoDesdeStorage(): void {
    if (!this.serie) {
      this.correlativo = '00000001';
      return;
    }

    const storageKey = `ultimoCorrelativo_${this.serie}`;
    const ultimoCorrelativoGuardado = localStorage.getItem(storageKey);

    if (ultimoCorrelativoGuardado) {
      // Convierte a número, incrementa y formatea a 8 dígitos
      const siguienteNumero = parseInt(ultimoCorrelativoGuardado, 10) + 1;
      this.correlativo = siguienteNumero.toString().padStart(8, '0');
    } else {
      // Primera venta para esta serie
      this.correlativo = '00000001';
    }
  }

  /**
   * Guarda el correlativo usado en localStorage
   */
  private guardarCorrelativoEnStorage(): void {
    if (!this.serie) return;

    const storageKey = `ultimoCorrelativo_${this.serie}`;
    localStorage.setItem(storageKey, this.correlativo);
  }

  /**
   * Maneja el cambio en el checkbox de efectivo exacto
   */
  onEfectivoExactoChange(): void {
    if (this.efectivoExacto) {
      this.montoEfectivo = this.total;
    } else {
      this.montoEfectivo = 0;
    }
  }

  mostrarTallas(item: any, idx: number) {
    this.currentItemIndex = idx;
    this.tallaProductoService.getTallasByProducto(item.idProducto).subscribe({
      next: t => {
        this.tallasProducto = t;
        this.mostrarModalTallas = true;
      },
      error: () => alert('Error cargando tallas')
    });
  }

  cerrarModalTallas() {
    this.mostrarModalTallas = false;
    this.currentItemIndex = null;
  }

  seleccionarTalla(t: any) {
    if (this.currentItemIndex !== null) {
      this.ventaItems[this.currentItemIndex].talla = `${t.usa}/${t.eur}/${t.cm}`;
      this.ventaItems[this.currentItemIndex].idUnidadMedida = t.usa;
    }
    this.cerrarModalTallas();
  }

  abrirModalCliente() { this.mostrarModalCliente = true; }
  cerrarModalCliente() { this.mostrarModalCliente = false; }
  manejarPersonaCreada(p: Persona) {
    this.personas.push(p);
    this.clienteSeleccionado = `${p.numeroDocumento} - ${p.nombre}`;
    this.cerrarModalCliente();
  }

  realizarVenta(form: NgForm) {
    if (form.invalid || this.ventaItems.length === 0) {
      return;
    }

    if (this.montoEfectivo !== this.total) {
      alert('El monto recibido debe ser exactamente igual al total de la venta.');
      return;
    }

    const detalles = this.ventaItems.map(it => {
      const totalItem = +(it.cantidad * it.precio).toFixed(2);
      const baseImponibleItem = +(totalItem / 1.18).toFixed(2);
      const igvItem = +(baseImponibleItem * 0.18).toFixed(2);

      return {
        idProducto: it.idProducto,
        IdTallaUsa: it.idUnidadMedida,
        descripcion: it.nombre,
        cantidad: it.cantidad,
        precio: it.precio,
        descuento: 0,
        total: totalItem,
        igv: igvItem
      };
    });

    const payload: any = {
      idUsuario: 22,
      tipoComprobante: this.documentoSeleccionado,
      fecha: new Date().toISOString(),
      total: this.total,
      estado: 'Emitido',
      serie: this.serie,
      numeroComprobante: this.correlativo,
      totalIgv: this.iva,
      detalles: detalles
    };

    this.ventaService.createVenta(payload).subscribe({
      next: resp => {
        this.ventaCreadaResponse = resp;
        this.mostrarConfirmacion = true;
        this.cargarProductos();
        // GUARDAR EL CORRELATIVO USADO ANTES DE RESETEAR
        this.guardarCorrelativoEnStorage();
        this.vaciarListado();
        this.resetearFormularioVenta();
      },
      error: err => {
        console.error("Error al crear la venta:", err);
        alert('Error interno al crear la venta.');
      }
    });
  }

  resetearFormularioVenta(): void {
    this.documentoSeleccionado = '';
    this.clienteSeleccionado = '';
    this.tipoPagoSeleccionado = '';
    this.montoEfectivo = 0;
    this.efectivoExacto = false; // Resetear el checkbox
    // NO resetear serie y correlativo, mantenerlos para la próxima venta
    // En su lugar, actualizar el correlativo para la próxima venta
    this.actualizarCorrelativoDesdeStorage();
  }

  imprimirComprobante() {
    const html = this.reporteBoletaContainer.nativeElement.innerHTML;
    const popup = window.open('', '_blank', 'width=400,height=600');
    popup!.document.write(`
      <html><head><title>Comprobante</title>
      <style>body{font-family:'Courier New'} .boleta{width:100%}</style>
      </head><body>${html}</body></html>`);
    popup!.document.close();
    popup!.print();
    popup!.close();
  }

  cancelarComprobante() {
    this.mostrarConfirmacion = false;
  }
}