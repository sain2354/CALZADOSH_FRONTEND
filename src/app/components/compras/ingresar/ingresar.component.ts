import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../services/compra.service';
// Importar las interfaces necesarias
import { CompraRequest, ItemCompraRequest, ItemCompra, Compra } from '../../../models/compra.model';
import { ProductoService } from '../../../services/producto.service';
import { Producto, SizeWithStock } from '../../../models/producto.model';
import { PersonaService } from '../../../services/persona.service';
import { Persona } from '../../../models/persona.model';
import { MedioPagoService } from '../../../services/medio-pago.service';
import { MedioPago } from '../../../models/medio-pago.model';
import { TallaService } from '../../../services/talla.service';
import { Talla } from '../../../models/talla.model';
import { debounceTime, distinctUntilChanged, switchMap, forkJoin } from 'rxjs';
import { Subject, Observable, of } from 'rxjs';

@Component({
  selector: 'app-ingresar-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingresar.component.html',
  styleUrls: ['./ingresar.component.css']
})
export class IngresarComprasComponent implements OnInit {
  compra: Compra = {
    fecha: new Date().toISOString().substring(0, 10),
    tipoDocumento: 'Boleta',
    idProveedor: 0,
    idFormaPago: 0,
    numeroDocumento: '00000001',
    serie: '0001',
    subtotal: 0,
    igv: 0,
    total: 0,
    items: []
  };

  terminoBusquedaProducto = new Subject<string>();
  productosEncontrados$: Observable<Producto[]> = of([]);
  productoSeleccionado: Producto | null = null;
  nombreProductoNuevoItem: string = '';

  proveedores: Persona[] = [];
  formasPago: MedioPago[] = [];
  listaTallasMaestra: Talla[] = [];

  tallasPorProducto: { [productId: number]: SizeWithStock[] } = {};

  modalTallaAbierto = false;
  itemEditandoTalla: ItemCompra | null = null;

  datosCargados = false;

  // *** CORREGIDO: Declarar las propiedades itemActual y tallaSeleccionada ***
  itemActual: ItemCompra = { // Declarar itemActual
    idProducto: 0,
    idTalla: 0,
    cantidad: 1,
    precioUnitario: 0,
       codigoBarra: undefined,
       nombreProducto: undefined,
       nombreTalla: undefined,
       stock: undefined,
       subtotalItem: undefined
  };
  tallaSeleccionada: any | null = null; // Declarar tallaSeleccionada (puedes tiparla mejor si sabes el tipo)


  constructor(
    private compraService: CompraService,
    private productoService: ProductoService,
    private personaService: PersonaService,
    private medioPagoService: MedioPagoService,
    private tallaService: TallaService
  ) { }

  ngOnInit(): void {
    this.productosEncontrados$ = this.terminoBusquedaProducto.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((termino: string) => this.productoService.buscarProductos(termino))
    );

    forkJoin({
      proveedores: this.personaService.getAllPersonas(),
      formasPago: this.medioPagoService.getAllMediosPago(),
      tallasMaestras: this.tallaService.getTallas()
    }).subscribe({
      next: (results: { proveedores: Persona[], formasPago: MedioPago[], tallasMaestras: Talla[] }) => {
        this.proveedores = results.proveedores.filter(p => p.tipoPersona === 'Proveedor');
        this.formasPago = results.formasPago;
        this.listaTallasMaestra = results.tallasMaestras;
        this.datosCargados = true;
        console.log('Datos iniciales cargados (Proveedores, Formas Pago, Tallas Maestras).');
        console.log('Contenido completo del array formasPago al cargar:', JSON.stringify(this.formasPago, null, 2));
        console.log('Contenido completo del array listaTallasMaestra al cargar:', JSON.stringify(this.listaTallasMaestra, null, 2));
      },
      error: (err: any) => {
        console.error('Error al cargar datos iniciales:', err);
        this.datosCargados = true;
      }
    });
  }

  buscarProductos(event: Event): void {
    const termino = (event.target as HTMLInputElement).value;
    this.terminoBusquedaProducto.next(termino);
  }

  seleccionarProducto(producto: Producto): void {
    const itemExistente = this.compra.items.find((item: ItemCompra) => item.idProducto === producto.idProducto);

    if (itemExistente) {
        itemExistente.cantidad++;
        this.calcularTotales();

         const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(itemExistente);
         if(tallasDisponibles.length > 0 && itemExistente.idTalla <= 0){
             this.abrirModalTallas(itemExistente);
         }

    } else {
        const nuevoItem: ItemCompra = {
            idProducto: producto.idProducto || 0,
            codigoBarra: producto.codigoBarra,
            nombreProducto: producto.nombre,
            cantidad: 1,
            precioUnitario: producto.precioVenta || 0,
            idTalla: 0,
            nombreTalla: 'Seleccione Talla',
            stock: (producto.sizes && producto.sizes.length > 0) ? 0 : (producto.stock || 0)
        };

        this.compra.items.push(nuevoItem);

        if (producto.idProducto) {
            this.tallasPorProducto[producto.idProducto] = producto.sizes || [];
        }

        this.calcularTotales();

        if(producto.sizes && producto.sizes.length > 0){
            this.abrirModalTallas(nuevoItem);
        }
    }

    this.nombreProductoNuevoItem = '';
    this.productosEncontrados$ = of([]);
    this.productoSeleccionado = null;
  }

  removerItem(index: number): void {
    if (index >= 0 && index < this.compra.items.length) {
      const itemIdProducto = this.compra.items[index].idProducto;
      const otrasInstancias = this.compra.items.filter((item: ItemCompra, i: number) => i !== index && item.idProducto === itemIdProducto);
      if (otrasInstancias.length === 0) {
         delete this.tallasPorProducto[itemIdProducto];
      }

      this.compra.items.splice(index, 1);
      this.calcularTotales();
    }
  }

  vaciarListado(): void {
    if (confirm('¿Estás seguro de que deseas vaciar el listado de productos de la compra?')) {
      this.compra.items = [];
      this.tallasPorProducto = {};
      this.calcularTotales();
    }
  }

  calcularTotales(): void {
    // MODIFICACIÓN: Eliminado el cálculo del IGV (18%)
    this.compra.subtotal = this.compra.items.reduce((sum: number, item: ItemCompra) => sum + (item.cantidad * item.precioUnitario), 0);
    this.compra.igv = 0; // IGV siempre será 0
    this.compra.total = parseFloat((this.compra.subtotal).toFixed(2)); // Total igual al subtotal
  }

  limpiarItemActual(): void {
    // *** CORREGIDO: Limpiar las propiedades de itemActual (ahora declarada) ***
    this.itemActual = {
      idProducto: 0,
      idTalla: 0,
      cantidad: 1,
      precioUnitario: 0,
       codigoBarra: undefined,
       nombreProducto: undefined,
       nombreTalla: undefined,
       stock: undefined,
       subtotalItem: undefined
    };
    this.productoSeleccionado = null;
    // *** CORREGIDO: Limpiar tallaSeleccionada (ahora declarada) ***
    this.tallaSeleccionada = null;
    this.tallasPorProducto = {};
  }

  realizarCompra(): void {
      console.log('Ítems de la compra antes de validación de talla:', this.compra.items);
      console.log('Array formasPago en el frontend (antes de find):', this.formasPago);
      console.log('ID de forma de pago seleccionado en compra:', this.compra.idFormaPago);


    if (this.compra.items.length > 0 && this.compra.idProveedor > 0 && this.compra.idFormaPago > 0 && this.compra.tipoDocumento && this.compra.numeroDocumento) {

        const itemsConTallasIncompletas = this.compra.items.filter((item: ItemCompra) => {
             const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(item);
             return tallasDisponibles.length > 0 && item.idTalla <= 0;
        });

        if(itemsConTallasIncompletas.length > 0){
            alert('Por favor, selecciona la talla para todos los productos que la requieren.');
            return;
        }

        const formaPagoSeleccionada = this.formasPago.find((fp: MedioPago) => String(fp.idMedioPago) === String(this.compra.idFormaPago));
        const nombreFormaPago = formaPagoSeleccionada ? formaPagoSeleccionada.descripcion : '';

        console.log('Forma de pago seleccionada encontrada:', formaPagoSeleccionada);
        console.log('Nombre de forma de pago a enviar:', nombreFormaPago);

        // *** Usar la interfaz CompraRequest, pero ajustando para enviar FormaPago como string ***
        // NOTA: Esto es una adaptación para el backend actual que espera 'FormaPago' como string.
        // Idealmente, el backend debería esperar idFormaPago.
        const compraRequest: any = { // Cambiamos a 'any' temporalmente para permitir 'FormaPago' como string
            idProveedor: Number(this.compra.idProveedor),
            tipoDocumento: this.compra.tipoDocumento,
            numeroDocumento: this.compra.numeroDocumento,
            FormaPago: nombreFormaPago, // Enviamos el nombre de la forma de pago con 'F' mayúscula
            itemsCompra: this.compra.items.map((item: ItemCompra) => ({
                idProducto: item.idProducto,
                idTalla: item.idTalla,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            })),
            serie: this.compra.serie
        };

        console.log('Datos de compra enviados al backend:', compraRequest);

      this.compraService.crearCompra(compraRequest).subscribe({
        next: (response: any) => {
          console.log('Compra registrada con éxito:', response);
          alert('Compra registrada con éxito!');
          this.resetearFormularioCompra();
        },
        error: (error: any) => {
          console.error('Error al registrar la compra:', error);
           if (error.error && error.error.errors) {
                console.error('Detalles de validación del backend:', error.error.errors);
                let errorMessages = 'Errores de validación: \n';
                for (const key in error.error.errors) {
                    if (error.error.errors.hasOwnProperty(key)) {
                         error.error.errors[key].forEach((msg: string) => {
                             errorMessages += `- ${key}: ${msg}\n`;
                         });
                    }
                }
                alert('Error al registrar la compra debido a validación del backend:\n' + errorMessages);
           } else if (error.error) {
                console.error('Cuerpo de respuesta del error:', error.error);
                alert('Error al registrar la compra: ' + (typeof error.error === 'string' ? error.error : JSON.stringify(error.error)));
           }
           else {
                alert('Error al registrar la compra. Por favor, inténtalo de nuevo.');
           }
        }
      });
    } else {
      alert('Por favor, agrega productos a la compra y completa los datos de la cabecera (Proveedor, Forma de Pago, Documento).');
    }
  }

  resetearFormularioCompra(): void {
    // *** Usar la interfaz Compra para inicializar ***
    this.compra = {
      fecha: new Date().toISOString().substring(0, 10),
      tipoDocumento: 'Boleta',
      idProveedor: 0,
      idFormaPago: 0,
      numeroDocumento: '00000001',
      serie: '0001',
      subtotal: 0,
      igv: 0,
      total: 0,
      items: []
    };
    this.productoSeleccionado = null;
    this.nombreProductoNuevoItem = '';
    this.tallasPorProducto = {};
     // No necesitas resetear listaTallasMaestra
  }

  abrirModalTallas(item: ItemCompra): void {
      const tallasDisponibles: SizeWithStock[] = this.getTallasForItem(item);
      if(tallasDisponibles.length === 0){
          alert('Este producto no tiene tallas definidas.');
          return;
      }

      this.itemEditandoTalla = item;
      this.modalTallaAbierto = true;
  }

  cerrarModalTallas(): void {
      this.modalTallaAbierto = false;
      this.itemEditandoTalla = null;
  }

  getTallasForEditingItem(): SizeWithStock[] {
     return this.itemEditandoTalla ? (this.tallasPorProducto[this.itemEditandoTalla.idProducto] || []) : [];
  }

  seleccionarTallaModal(tallaProducto: SizeWithStock): void {
      console.log('Talla de Producto seleccionada en modal (desde TallaProducto):', tallaProducto);

      if(this.itemEditandoTalla){
          const tallaMaestraEncontrada = this.listaTallasMaestra.find((t: Talla) => String(t.usa) === String(tallaProducto.usa));

          if (tallaMaestraEncontrada) {
              this.itemEditandoTalla.idTalla = tallaMaestraEncontrada.idTalla || 0;
              this.itemEditandoTalla.nombreTalla = tallaMaestraEncontrada.usa?.toString() || tallaMaestraEncontrada.eur?.toString() || tallaMaestraEncontrada.cm?.toString() || 'N/A';
              this.itemEditandoTalla.stock = tallaProducto.stock;

              console.log('Talla Maestra encontrada (desde tabla Talla):', tallaMaestraEncontrada);
              console.log('Item actualizado después de seleccionar talla (con idTalla de tabla Talla):', this.itemEditandoTalla);

              this.calcularTotales();
              this.cerrarModalTallas();
          } else {
              console.error('No se encontró la talla maestra correspondiente para el valor USA:', tallaProducto.usa);
              alert('Error: No se pudo encontrar la información completa de la talla seleccionada.');
          }

      }
  }

  getTallasForItem(item: ItemCompra): SizeWithStock[] {
     return item.idProducto ? (this.tallasPorProducto[item.idProducto] || []) : [];
  }

}