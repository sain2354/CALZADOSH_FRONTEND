// punto-venta.component.ts  (modificado sólo en imports del decorador)
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { NgxPaginationModule } from 'ngx-pagination';

import { ProductoService } from '../../../services/producto.service';
import { VentaService } from '../../../services/venta.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { PersonaService } from '../../../services/persona.service';
import { PersonaComponent } from '../../persona/nuevo-persona/persona.component';
// import { BoletaVentaComponent } from '../../../boleta-venta/boleta-venta.component';
import { InvoiceComponent } from '../../../invoice/invoice.component'; // <-- nuevo
import { Persona } from '../../../models/persona.model';
import { AuthService } from '../../../services/auth.service'; // <- añadir si no está

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxPaginationModule,
    AutocompleteLibModule,
    PersonaComponent,
    InvoiceComponent // <-- sustituye BoletaVentaComponent
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

  // Nuevo: objeto usado para abrir el modal en modo Cliente
  nuevoCliente: Persona = {
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    tipoPersona: 'Cliente',
    tipoDocumento: 'DNI',
    numeroDocumento: ''
  };

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
  clienteSeleccionado: Persona | 'VARIOS' | null = null;

  mediosPago = ['Efectivo','Yape', 'Plin', 'Transferencia'];
  tipoPagoSeleccionado = '';
  serie = '';
  correlativo = '00000001';

  // Variables para controlar correlativos (valores guardados que representan el *último* correlativo ya utilizado)
  ultimoCorrelativoBoleta = 0;
  ultimoCorrelativoFactura = 0;

  montoEfectivo = 0;
  get vuelto() {
    return +(this.montoEfectivo - this.total).toFixed(2);
  }

  // PAGINACIÓN Y FILTRO
  currentPage: number = 1;
  itemsPerPageOptions: number[] = [5, 10, 25, 50];
  itemsPerPage: number = 10;
  searchTerm: string = '';

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
      moneda: 'S/',
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

// referencia al InvoiceComponent para llamar generateQr/generateBarcode antes de imprimir
@ViewChild(InvoiceComponent, { static: false })
invoiceComponent!: InvoiceComponent;

// usuario actual (nombre / username) traído desde AuthService / localStorage
usuarioActual: string | null = null;


  constructor(
  private productoService: ProductoService,
  private ventaService: VentaService,
  private tallaProductoService: TallaProductoService,
  private personaService: PersonaService,
  private authService: AuthService // <- nuevo
) {}

  ngOnInit(): void {
  this.cargarProductos();
  this.cargarPersonas();

  // Obtener username desde AuthService (login guardó username en localStorage vía authService.loginSuccess)
  try {
    this.usuarioActual = this.authService.getUsername() ?? null;
  } catch {
    // fallback a localStorage directo por si acaso
    try {
      const raw = localStorage.getItem('username') || localStorage.getItem('usuario');
      this.usuarioActual = raw ? JSON.parse(raw)?.username ?? raw : null;
    } catch {
      this.usuarioActual = null;
    }
  }

  // Inicializar correlativos
  this.ultimoCorrelativoBoleta = parseInt(localStorage.getItem('ultimoCorrelativoBoleta') || '0', 10) || 0;
  this.ultimoCorrelativoFactura = parseInt(localStorage.getItem('ultimoCorrelativoFactura') || '0', 10) || 0;
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
      next: p => {
        // Filtrar SOLO clientes para punto de venta
        this.personas = (p || []).filter(persona => persona.tipoPersona === 'Cliente');
      },
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
    // El precio ya incluye IGV, por lo que el subtotal es la suma de precios * cantidad
    const sum = this.ventaItems.reduce((acc, it) => acc + it.cantidad * it.precio, 0);
    this.subTotal = +sum.toFixed(2);
    
    // Calcular IGV (18% del subtotal)
    this.iva = +(this.subTotal * 0.18).toFixed(2);
    
    // El total es igual al subtotal (ya que el IGV está incluido)
    this.total = +(this.subTotal - this.descuento).toFixed(2);
  }

  /**
   * Cuando el usuario cambia el documento (Boleta/Factura) mostramos la serie y
   * el *preview* del correlativo sin persistirlo todavía.
   * Nota: NO incrementamos localStorage aquí. El incremento final se hará sólo
   * cuando la venta se registre con éxito en realizarVenta().
   */
  onDocumentoChange() {
    if (this.documentoSeleccionado === 'Boleta') {
      this.serie = 'B001';
      // preview = ultimoCorrelativoBoleta (último usado) + 1
      this.correlativo = (this.ultimoCorrelativoBoleta + 1).toString().padStart(8, '0');
    } else if (this.documentoSeleccionado === 'Factura') {
      this.serie = 'F001';
      this.correlativo = (this.ultimoCorrelativoFactura + 1).toString().padStart(8, '0');
    } else {
      this.serie = '';
      this.correlativo = '00000001';
    }
  }

  mostrarTallas(item: any, idx: number) {
    this.currentItemIndex = idx;
    this.tallaProductoService.getTallasByProducto(item.idProducto).subscribe({
      next: t => {
        this.tallasProducto = t;
        console.log('Respuesta de getTallasByProducto:', t);
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

  abrirModalCliente() {
    // Asegurarnos que el modal abra con modo Cliente
    this.nuevoCliente = {
      nombre: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipoPersona: 'Cliente',
      tipoDocumento: 'DNI',
      numeroDocumento: ''
    };
    this.mostrarModalCliente = true;
  }
  cerrarModalCliente() { this.mostrarModalCliente = false; }

  manejarPersonaCreada(p: Persona) {
  // Sólo agregar si realmente es Cliente
  if (p && p.tipoPersona === 'Cliente') {
    this.personas.push(p);
    // Guardamos el objeto Persona (no su texto) para que coincida con el tipo Cliente | 'VARIOS' | null
    this.clienteSeleccionado = p;
  } else {
    console.warn('Se intentó agregar una persona que no es Cliente en Punto de Venta:', p);
  }
  this.cerrarModalCliente();
}


  realizarVenta(form: NgForm) {
    // AÑADIDO: Validación para mostrar un mensaje si no hay productos
    if (this.ventaItems.length === 0) {
      alert('No hay productos en el listado.');
      console.log("DEBUG (Frontend): No hay items en la venta.");
      return;
    }

    if (form.invalid) {
      console.log("DEBUG (Frontend): Formulario inválido.");
      return;
    }

    // Validación de efectivo exacto
    if (this.montoEfectivo !== this.total) {
      alert('El monto recibido debe ser exactamente igual al total de la venta.');
      console.log("DEBUG (Frontend): Monto recibido no es exacto.");
      return;
    }

    const detalles = this.ventaItems.map(it => {
  const base = +(it.cantidad * it.precio).toFixed(2);
  return {
    idProducto: it.idProducto,
    IdTallaUsa: it.idUnidadMedida,
    descripcion: it.nombre,
    nombre: it.nombre,         // opcional: por si invoice usa nombre
    cantidad: it.cantidad,
    precio: it.precio,
    talla: it.talla ?? '',     // <-- ADICIÓN: guarda la talla del item
    descuento: 0,
    total: base,
    igv: +(base * 0.18).toFixed(2)
  };
});

// EXTRAEMOS datos del cliente seleccionado (puede ser Persona, 'VARIOS' o null)
const clienteObj = (this.clienteSeleccionado && typeof this.clienteSeleccionado === 'object') ? this.clienteSeleccionado as Persona : null;
const clienteNombre = clienteObj ? clienteObj.nombre : (this.clienteSeleccionado === 'VARIOS' ? 'Clientes Varios' : '');
const clienteDocumento = clienteObj ? clienteObj.numeroDocumento : (this.clienteSeleccionado === 'VARIOS' ? '00000000' : '');
const direccion = clienteObj ? clienteObj.direccion : '';

// Construimos payload incluyendo datos del cliente y forma de pago
// obtener nombre del vendedor desde usuarioActual (AuthService)
const vendedorNombre = this.usuarioActual || this.authService.getUsername?.() || 'PuntoVenta';

const payload: any = {
  idUsuario: 22,
  tipoComprobante: this.documentoSeleccionado,
  fecha: new Date().toISOString(),
  total: this.total,
  estado: 'Emitido',
  serie: this.serie,
  numeroComprobante: this.correlativo,
  totalIgv: this.iva,
  detalles: detalles,
  clienteNombre: clienteNombre,
  clienteDocumento: clienteDocumento,
  direccion: direccion,
  formaPago: this.tipoPagoSeleccionado,
  vendedor: vendedorNombre
};


this.ventaService.createVenta(payload).subscribe({
  next: resp => {
    // Actualizamos correlativos (misma lógica que ya tenías)
    if (this.documentoSeleccionado === 'Boleta') {
      const stored = Number(localStorage.getItem('ultimoCorrelativoBoleta') || '0');
      const newCount = Math.max(stored, this.ultimoCorrelativoBoleta) + 1;
      this.ultimoCorrelativoBoleta = newCount;
      localStorage.setItem('ultimoCorrelativoBoleta', String(newCount));
    } else if (this.documentoSeleccionado === 'Factura') {
      const stored = Number(localStorage.getItem('ultimoCorrelativoFactura') || '0');
      const newCount = Math.max(stored, this.ultimoCorrelativoFactura) + 1;
      this.ultimoCorrelativoFactura = newCount;
      localStorage.setItem('ultimoCorrelativoFactura', String(newCount));
    }

    // ENRIQUECEMOS la respuesta para asegurar que el Invoice reciba cliente, documento y dirección
    const detalles = this.ventaItems.map(it => {
  const base = +(it.cantidad * it.precio).toFixed(2);
  return {
    idProducto: it.idProducto,
    IdTallaUsa: it.idUnidadMedida,
    descripcion: it.nombre,
    nombre: it.nombre,         // opcional: por si invoice usa nombre
    cantidad: it.cantidad,
    precio: it.precio,
    talla: it.talla ?? '',     // <-- ADICIÓN: guarda la talla del item
    descuento: 0,
    total: base,
    igv: +(base * 0.18).toFixed(2)
  };
});

// ...

this.ventaCreadaResponse = Object.assign({}, resp, {
  clienteNombre,
  clienteDocumento,
  direccion,
  formaPago: this.tipoPagoSeleccionado,
  vendedor: vendedorNombre,
  serie: this.serie,
  numeroComprobante: this.correlativo,
  fecha: new Date().toISOString(),
  moneda: 'S/',
  // <-- ADICIÓN: pasamos los detalles ya normalizados al InvoiceComponent
  detalles: (detalles || []).map(d => ({
  cantidad: d.cantidad,
  precio: d.precio,
  total: d.total,
  descripcion: d.descripcion,
  nombre: d.nombre,
  talla: d.talla,
  desc: d.descuento ?? 0    // <-- usar solo la propiedad que sí existe
}))
});



    this.mostrarConfirmacion = true;
    this.cargarProductos();
    this.vaciarListado();

    // Resetear formulario y valores
    this.resetearFormularioVenta();
    console.log("DEBUG (Frontend): Venta creada exitosamente.");
  },
  error: err => {
    console.error("ERROR (Frontend): Error al crear la venta:", err);
    alert('Error interno al crear la venta.');
  }
});

  }

  // Función para resetear otros campos del formulario de venta
  resetearFormularioVenta(): void {
    this.documentoSeleccionado = '';
    this.clienteSeleccionado = null; // ahora limpiamos el objeto cliente
    this.tipoPagoSeleccionado = '';
    this.serie = '';
    // dejamos el correlativo en el valor por defecto; el usuario al seleccionar el documento verá el preview correcto
    this.correlativo = '00000001';
    this.montoEfectivo = 0;
}


  async imprimirComprobante() {
  try {
    // 1) Si existe la instancia del InvoiceComponent, forzamos regenerar barcode y QR
    if (this.invoiceComponent) {
      await this.invoiceComponent.generateBarcode();
      await this.invoiceComponent.generateQr();
    }

    // 2) Espera corta para que las imágenes (dataURL o externas) terminen de asignarse
    await new Promise(res => setTimeout(res, 300)); // 300ms (ajusta si hace falta)

    // 3) Obtener HTML actualizado (con <img src="..."> ya en su lugar)
    const html = this.reporteBoletaContainer.nativeElement.innerHTML;

    // 4) Abrir popup y escribir HTML para imprimir
    const popup = window.open('', '_blank', 'width=900,height=900');
    if (!popup) {
      alert('No se pudo abrir la ventana de impresión. Revisa bloqueadores de pop-ups.');
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Comprobante</title>
          <style>
            body{font-family:'Poppins', sans-serif; margin:8px;}
            /* puedes inyectar estilos aquí si los necesitas */
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    popup.document.close();

    // 5) Esperar un momento a que el popup cargue las imágenes
    await new Promise(res => setTimeout(res, 350));

    popup.focus();
    popup.print();
    // popup.close(); // opcional
  } catch (err) {
    console.error('Error en imprimirComprobante:', err);
    alert('Error preparando la boleta para impresión. Revisa la consola.');
  }
}


  cancelarComprobante() {
    this.mostrarConfirmacion = false;
  }

  // -------------- PAGINACIÓN / FILTRO ----------------

  // getter que devuelve la lista filtrada (sin paginar)
  get filteredVentaItems() {
    if (!this.searchTerm) return this.ventaItems;
    const term = this.searchTerm.toLowerCase();
    return this.ventaItems.filter(it =>
      (it.nombre || '').toLowerCase().includes(term) ||
      (it.codigo || '').toLowerCase().includes(term)
    );
  }

  // para mostrar rangos en el pie: displayedFrom / displayedTo (basado en currentPage & itemsPerPage)
  get displayedFrom(): number {
    const total = this.filteredVentaItems.length;
    if (total === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get displayedTo(): number {
    const total = this.filteredVentaItems.length;
    const to = this.currentPage * this.itemsPerPage;
    return to > total ? total : to;
  }

  // función auxiliar: dado el index en la página (0..n) devuelve el índice global en ventaItems
  getGlobalIndex(indexOnPage: number): number {
    const pageItems = this.filteredVentaItems.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage);
    const item = pageItems[indexOnPage];
    if (!item) return indexOnPage;
    const realIndex = this.ventaItems.findIndex(it => it === item);
    return realIndex >= 0 ? realIndex : indexOnPage;
  }

  // manejador de cambio de página desde pagination-controls
  pageChanged(newPage: number) {
    this.currentPage = newPage;
  }
}
