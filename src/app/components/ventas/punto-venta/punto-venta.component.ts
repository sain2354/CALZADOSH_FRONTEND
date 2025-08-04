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
    idUnidadMedida?: number;      // <-- nuevo campo
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
        // sincroniza stock en items actuales
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
    const sum = this.ventaItems.reduce((acc, it) => acc + it.cantidad * it.precio, 0);
    this.subTotal = +sum.toFixed(2);
    this.iva = +(this.subTotal * 0.18).toFixed(2);
    this.total = +(this.subTotal + this.iva - this.descuento).toFixed(2);
  }

  onDocumentoChange() {
    if (this.documentoSeleccionado === 'Boleta') this.serie = 'B001';
    else if (this.documentoSeleccionado === 'Factura') this.serie = 'F001';
    else this.serie = '';
    this.correlativo = '00000001';
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
      // guardamos descripción y también el ID real de la talla
      this.ventaItems[this.currentItemIndex].talla = `${t.usa}/${t.eur}/${t.cm}`;
      this.ventaItems[this.currentItemIndex].idUnidadMedida = t.idUnidadMedida;  // <-- aquí
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
    if (form.invalid || this.ventaItems.length === 0) return;

    // Validación de efectivo exacto
    if (this.montoEfectivo !== this.total) {
      alert('El monto recibido debe ser exactamente igual al total de la venta.');
      return;
    }

    const detalles = this.ventaItems.map(it => {
      const base = +(it.cantidad * it.precio).toFixed(2);
      return {
        idProducto: it.idProducto,
        idUnidadMedida: it.idUnidadMedida,     // <-- incluido
        descripcion: it.nombre,
        cantidad: it.cantidad,
        precio: it.precio,
        descuento: 0,
        total: base,
        igv: +(base * 0.18).toFixed(2)
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
      detalles
    };

    this.ventaService.createVenta(payload).subscribe({
      next: resp => {
        this.ventaCreadaResponse = resp;
        this.mostrarConfirmacion = true;
        this.cargarProductos(); // refresca stock
      },
      error: err => {
        console.error(err);
        alert('Error interno al crear la venta.');
      }
    });
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
