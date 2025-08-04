// listado-productos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { jsPDF } from 'jspdf';


import { ProductoService } from '../../../services/producto.service';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { Producto, SizeWithStock, Promocion } from '../../../models/producto.model';
import { Talla } from '../../../models/talla.model';
import JsBarcode from 'jsbarcode'; // Ejemplo de importación
import { Canvg } from 'canvg';


@Component({
  selector: 'app-listado-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
 NgxPaginationModule,
    NgIf, // Import NgIf
    AutocompleteLibModule
  ],
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.css']
})
export class ListadoProductosComponent implements OnInit {
  // ============ PAGINACIÓN Y FILTROS ============
  page: number = 1;
  pageSize: number = 10;
  totalRegistros: number = 0;
  selectedCategory: number = 0; // 0 => Todos
  selectedGenero: string = ''; // Added
  selectedArticulo: string = ''; // Added
  selectedEstilo: string = ''; // Added

  // Added: property to control filter visibility
  showFilters: boolean = false;

  // ============ AUTOCOMPLETE ============
  keyword = 'nombre';
  productosAutoComplete: any[] = [];

  // Filtro interno (por nombre/categoría, etc.)
  filtro: string = '';

  // Lista de productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  // Listas para combos
  categorias: { id: number, nombre: string }[] = [
    { id: 0, nombre: 'Todos' },
    { id: 1, nombre: 'Hombres' },
    { id: 2, nombre: 'Mujeres' },
    { id: 3, nombre: 'Infantil' }
  ];

  // Added: Lists for new filters
  generos: string[] = ['Todos', 'Masculino', 'Femenino', 'Unisex']; // Example values, adjust as needed
  articulos: string[] = ['Todos', 'Zapatillas', 'Sandalias', 'Botas', 'Zapatos']; // Example values, adjust as needed
  estilos: string[] = ['Todos', 'Casual', 'Deportivo', 'Formal']; // Example values, adjust as needed

  // Subcategorías (ejemplo)
  subcategorias: { id: number, idCategoria: number, nombre: string }[] = [
    { id: 1, idCategoria: 1, nombre: 'Nike' },
    { id: 2, idCategoria: 1, nombre: 'Adidas' },
    { id: 3, idCategoria: 1, nombre: 'Puma' },
    { id: 4, idCategoria: 1, nombre: 'I-Run' },
    { id: 5, idCategoria: 1, nombre: 'Reebok' },
    { id: 6, idCategoria: 1, nombre: 'Casual' },
    { id: 7, idCategoria: 2, nombre: 'Deporte' },
    { id: 8, idCategoria: 3, nombre: 'Outdoor' },
    { id: 9, idCategoria: 2, nombre: 'Nike' },
    { id: 10, idCategoria: 2, nombre: 'Adidas' },
    { id: 11, idCategoria: 2, nombre: 'Puma' },
    { id: 12, idCategoria: 2, nombre: 'I-Run' },
    { id: 13, idCategoria: 2, nombre: 'Reebok' },
    { id: 14, idCategoria: 3, nombre: 'Nike' },
    { id: 15, idCategoria: 3, nombre: 'Adidas' },
    { id: 16, idCategoria: 3, nombre: 'Puma' },
    { id: 17, idCategoria: 3, nombre: 'I-Run' },
    { id: 18, idCategoria: 3, nombre: 'Reebok' }
  ];

  unidadesMedida: { id: number, nombre: string }[] = [
    { id: 1, nombre: 'Pieza' },
    { id: 2, nombre: 'Caja' },
    { id: 3, nombre: 'Par' }
  ];

  // Modal
  modalAbierto: boolean = false;
  producto: Producto = this.nuevoProducto();
  subcategoriasFiltradas: { id: number, nombre: string }[] = [];

  // Tallas
  tallasDisponibles: Talla[] = [];
  tallaSeleccionadaId: number = 0;
  stockTallaSeleccionada: number = 0;
  tallasSeleccionadas: SizeWithStock[] = [];

  // Modal código de barras
  modalCodigoBarrasAbierto: boolean = false;
  productoParaCodigo: Producto | null = null;
  codigoBarrasData = {
    codigoProducto: '',
    tallaSeleccionada: '',
    fila: 1,
    columna: 1
  };

  // Aquí guardaremos el archivo seleccionado (en vez de usar base64)
  archivoSeleccionado: File | null = null;
  imagenExistenteUrl: string | null = null; // Added property

  constructor(
    private productoService: ProductoService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService
  ) {}

  ngOnInit(): void {
    this.cargarTallas();
    this.cargarProductos();
  }

  // ============ CARGAR TALLAS ============
  cargarTallas() {
    this.tallaService.getTallas().subscribe({
      next: (data) => {
        this.tallasDisponibles = data;
      },
      error: (err: any) => {
        console.error('Error al cargar tallas:', err);
      }
    });
  }

  // ============ CARGAR PRODUCTOS ============
  cargarProductos() {
    // Modified to include new filters
    this.productoService.getAll(
      this.selectedCategory,
      this.selectedGenero === 'Todos' ? null : this.selectedGenero,
      this.selectedArticulo === 'Todos' ? null : this.selectedArticulo,
      this.selectedEstilo === 'Todos' ? null : this.selectedEstilo
    ).subscribe({
      next: (lista) => {
        this.productos = lista;

        // Para Autocomplete
        this.productosAutoComplete = this.productos.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          categoria: p.categoria // Assuming 'categoria' is still used for display or other purposes
        }));

        // Filtro interno
        this.productosFiltrados = [...this.productos];
        this.totalRegistros = this.productosFiltrados.length;

        this.aplicarFiltro();
      },
      error: (error: any) => {
        console.error('Error al obtener productos:', error);
        this.productos = [];
        this.productosFiltrados = [];
      }
    });
  }

  // Added: Methods for new filter changes
  onGeneroChange(genero: string) {
    this.selectedGenero = genero;
    this.page = 1;
    this.cargarProductos();
  }

  onArticuloChange(articulo: string) {
    this.selectedArticulo = articulo;
    this.page = 1;
    this.cargarProductos();
  }

  onEstiloChange(estilo: string) {
    this.selectedEstilo = estilo;
    this.page = 1;
    this.cargarProductos();
  }

  onCategoryChange(cat: number) {
    this.selectedCategory = cat;
    this.page = 1;
    this.cargarProductos();
    if (this.modalAbierto) {
      const nombreCat = this.categorias.find(c => c.id === cat)?.nombre;
      this.cargarTallasPorCategoria(nombreCat);
      this.tallasSeleccionadas = [];
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
  }

  siguientePagina() {
    const totalPages = Math.ceil(this.productosFiltrados.length / this.pageSize);
    if (this.page < totalPages) {
      this.page++;
    }
  }

  anteriorPagina() {
    if (this.page > 1) {
      this.page--;
    }
  }

  onPageChange(newPage: number) {
    this.page = newPage;
  }

  // ============ FILTRO INTERNO ============
  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria?.toLowerCase().includes(texto) ||
        p.genero?.toLowerCase().includes(texto) || // Added
        p.articulo?.toLowerCase().includes(texto) || // Added
        p.estilo?.toLowerCase().includes(texto) // Added
    );
    this.totalRegistros = this.productosFiltrados.length;
  }

  selectEvent(item: any) {
    this.filtro = item.nombre;
    this.aplicarFiltro();
  }

  onChangeSearch(search: string) {
    this.filtro = search;
    this.aplicarFiltro();
  }

  onFocused(e: any) {}

  // ============ SUBCATEGORÍAS ============
  actualizarSubcategorias() {
    // 1) Filtras subcategorías
    this.subcategoriasFiltradas = this.subcategorias.filter(
      s => s.idCategoria === Number(this.producto.idCategoria)
    );
    this.producto.idSubCategoria = 0;

    // 2) Determinas la categoría elegida
    const cat = this.categorias.find(c => c.id === this.producto.idCategoria)?.nombre;
    console.log('[DEBUG] actualizarSubcategorias → categoria elegida:', cat);

    // 3) Lógicas de carga
    if (cat && cat !== 'Todos') {
      console.log('[DEBUG] Llamo a cargarTallasPorCategoria con:', cat);
      this.cargarTallasPorCategoria(cat);
    } else {
      console.log('[DEBUG] Llamo a cargarTallas() (todos)');
      this.cargarTallas();
    }

    // 4) Limpieza UI
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
  }

  cargarTallasPorCategoria(categoriaNombre?: string) {
    console.log('[DEBUG] pedir tallas al servicio con filtro:', categoriaNombre);
    this.tallaService.getTallas(categoriaNombre).subscribe({
      next: lista => {
        console.log('[DEBUG] respuesta getTallas:', lista);
        this.tallasDisponibles = lista;
      },
      error: (err: any) => console.error('Error al filtrar tallas:', err)
    });
  }

  // ============ GUARDAR PRODUCTO ============
  guardarProducto() {
    const formData = new FormData();

    // Append product data
    formData.append('IdCategoria', String(this.producto.idCategoria ?? 0));
    if (this.producto.idSubCategoria) {
      formData.append('IdSubCategoria', String(this.producto.idSubCategoria));
    }
    formData.append('CodigoBarra', this.producto.codigoBarra ?? '');
    formData.append('Nombre', this.producto.nombre ?? '');
    formData.append('Stock', String(this.producto.stock ?? 0));
    formData.append('StockMinimo', String(this.producto.stockMinimo ?? 0));
    formData.append('PrecioVenta', String(this.producto.precioVenta ?? 0));

    if (this.producto.precioCompra != null) {
      formData.append('PrecioCompra', String(this.producto.precioCompra));
    }
    formData.append('IdUnidadMedida', String(this.producto.idUnidadMedida ?? 0));
    formData.append('Estado', this.producto.estado ? 'true' : 'false');

    // — Campos adicionales —
    if (this.producto.mpn) {
      formData.append('Mpn', this.producto.mpn);
    }
    formData.append('ShippingInfo', this.producto.shippingInfo || '');
    if (this.producto.material) {
      formData.append('Material', this.producto.material);
    }
    if (this.producto.color) {
      formData.append('Color', this.producto.color);
    }
    // Added: Append new fields to formData
    if (this.producto.genero) {
      formData.append('Genero', this.producto.genero);
    }
    if (this.producto.articulo) {
      formData.append('Articulo', this.producto.articulo);
    }
    if (this.producto.estilo) {
      formData.append('Estilo', this.producto.estilo);
    }

    // — Array de tallas enriquecidas —
    this.tallasSeleccionadas.forEach((talla, i) => {
      formData.append(`Sizes[${i}].Usa`,   (talla.usa ?? '').toString());
      formData.append(`Sizes[${i}].Eur`,   (talla.eur ?? '').toString());
      formData.append(`Sizes[${i}].Cm`,    (talla.cm ?? '').toString());
      formData.append(`Sizes[${i}].Stock`, talla.stock.toString());
    });

    // — Imagen —
    if (this.archivoSeleccionado) {
      formData.append(
        'imagen',
        this.archivoSeleccionado,
        this.archivoSeleccionado.name
      );
    }

    // Si es edición
    if (this.producto.idProducto && this.producto.idProducto > 0) {
      this.productoService.updateProducto(this.producto.idProducto, formData).subscribe({
        next: (productoActualizado) => {
          console.log('Producto actualizado con éxito:', productoActualizado);
          this.cargarProductos(); // Load products after update
          this.cerrarModal();
        },
        error: (error: any) => {
          console.error('Error al actualizar el producto:', error);
        }
      });
    }
    // Si es nuevo
    else {
      this.productoService.crearProductoConArchivo(formData).subscribe({
        next: (productoCreado) => {
          console.log('Producto creado con éxito:', productoCreado);
          this.cargarProductos(); // Load products after creation
          this.cerrarModal();
        },
        error: (error: any) => {
          console.error('Error al guardar el producto:', error);
        }
      });
    }
  }

  // Removed the redundant guardarTallasProducto method as backend handles it.

  // ============ AGREGAR / ELIMINAR TALLA ============
  agregarTalla() {
    if (!this.tallaSeleccionadaId || this.tallaSeleccionadaId === 0) {
      alert('Selecciona una talla');
      return;
    }
    if (!this.stockTallaSeleccionada || this.stockTallaSeleccionada <= 0) {
      alert('Ingresa un stock válido para la talla');
      return;
    }

    const tallaEncontrada = this.tallasDisponibles.find(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );
    if (!tallaEncontrada) {
      alert('Talla no válida');
      return;
    }

    const yaExiste = this.tallasSeleccionadas.some(
      (t) => t.idTalla === this.tallaSeleccionadaId
    );
    if (yaExiste) {
      alert('Esta talla ya fue agregada.');
      return;
    }

    this.tallasSeleccionadas.push({
      idTalla: tallaEncontrada.idTalla,
      usa: tallaEncontrada.usa,
      eur: tallaEncontrada.eur,
      cm: tallaEncontrada.cm,
      stock: this.stockTallaSeleccionada
    });

    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
  }

  eliminarTalla(index: number) {
    this.tallasSeleccionadas.splice(index, 1);
  }

  // ============ MODAL ============
  abrirModal() {
    console.log('Abriendo modal de nuevo producto'); // Agrega esta línea
    this.modalAbierto = true;
    console.log('Valor de modalAbierto:', this.modalAbierto); // Agrega esta línea
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.subcategoriasFiltradas = [];

    const cat = this.categorias.find(c => c.id === this.producto.idCategoria)?.nombre;
    if (cat && cat !== 'Todos') {
      this.cargarTallasPorCategoria(cat);
    } else {
      this.cargarTallas();
    }
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
    this.archivoSeleccionado = null;
    this.imagenExistenteUrl = null; // Reset existing image URL on modal close
  }

  manejarFoto(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
    }
  }

  private nuevoProducto(): Producto {
    return {
      idProducto: 0,
      codigoBarra: '',
      categoria: '',
      nombre: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      minStock: 0,
      estado: true,
      idCategoria: 0,
      idSubCategoria: 0,
      stockMinimo: 0,
      idUnidadMedida: 0,
      foto: '',
      mpn: '',
      shippingInfo: 'precio de delivery no incluido',
      material: '',
      color: '',
      genero: '', // Added initialization
      articulo: '', // Added initialization
      estilo: '', // Added initialization
      sizes: []
    };
  }

  editarProducto(prod: Producto) {
    // Store the existing image URL
    this.imagenExistenteUrl = prod.foto ?? null;
    // Deep copy to avoid modifying the original product in the list
    this.producto = {...prod};
    this.modalAbierto = true;

    // Populate new fields when editing
    this.producto.genero = prod.genero; // Added
    this.producto.articulo = prod.articulo; // Added
    this.producto.estilo = prod.estilo; // Added

    if (prod.idProducto) {
      this.tallaProductoService.getTallasByProducto(prod.idProducto).subscribe({
        next: (tallas) => {
          this.tallasSeleccionadas = tallas.map(t => ({
            idTalla: t.idTalla,
            usa: t.usa,
            eur: t.eur,
            cm: t.cm,
            stock: t.stock
          }));
        },
        error: (err: any) => {
          console.error('Error al cargar tallas del producto:', err);
        }
      });
    }
  }

  generarCodigoBarras(prod: Producto) {
    this.productoParaCodigo = prod;

    // Validar y limitar fila y columna para la interfaz
    const maxFila = 7;
    const maxColumna = 3;
    let fila = this.codigoBarrasData.fila;
    let columna = this.codigoBarrasData.columna;

    if (fila > maxFila) {
 console.warn(`El número máximo de filas recomendado es ${maxFila}. Se usará ${fila}.`);
 // No limitamos aquí, solo advertimos
    }
    if (columna > maxColumna) {
      alert(`El número máximo de columnas permitido es ${maxColumna}. Se usará ${maxColumna}.`);
      columna = maxColumna;
    }

    this.codigoBarrasData = {
      codigoProducto: prod.codigoBarra || '',
      tallaSeleccionada: '', // Reset tallaSeleccionada when opening the modal
      fila: fila, // Usar los valores validados
 columna: columna
 };

    // *** AGREGAR ESTA LÓGICA PARA CARGAR LAS TALLAS DEL PRODUCTO ***
    if (prod.idProducto) {
      this.tallaProductoService.getTallasByProducto(prod.idProducto).subscribe({
        next: (tallas) => {
          // Mapear las tallas obtenidas al formato que esperas en tallasSeleccionadas
          this.tallasSeleccionadas = tallas.map(t => ({
            idTalla: t.idTalla,
            usa: t.usa,
            eur: t.eur,
            cm: t.cm,
            stock: t.stock // Asegúrate de que el servicio devuelve 'stock' si lo necesitas
          }));
          // Ahora que las tallas están cargadas, abrir el modal
          this.modalCodigoBarrasAbierto = true;
        },
        error: (err: any) => {
          console.error('Error al cargar tallas del producto para código de barras:', err);
          // Opcional: Mostrar un mensaje al usuario si hay un error
          alert('No se pudieron cargar las tallas para generar el código de barras.');
        }
      });
    } else {
      // Si el producto no tiene idProducto, no podemos cargar sus tallas
      console.warn('Producto sin idProducto, no se pueden cargar las tallas para código de barras.');
      alert('No se puede generar código de barras para este producto (falta ID).');
    }
  }




  async generarPDFCodigoBarras() { // Make the method async

    // Explicitly check if a talla has been selected
    if (!this.codigoBarrasData.tallaSeleccionada || this.codigoBarrasData.tallaSeleccionada === '') {
      // You can set a flag here to display a message in the HTML if needed
      return; // Stop execution if no talla is selected
    }

    // Find the complete talla details based on the selected USA size
    const tallaSeleccionadaCompleta = this.tallasSeleccionadas.find(
      t => t.usa === this.codigoBarrasData.tallaSeleccionada
    );

 // Usar milímetros como unidad
    // Usar milímetros como unidad
    const doc = new jsPDF('p', 'mm', 'a4'); // Default portrait, mm, A4

    // Fixed dimensions in millimeters, based on A4 label sheet layout (adjust as needed)
 const labelWidth = 58.2; // Ancho de cada celda/etiqueta (aprox. 220px)
    const labelHeight = 31.75; // Alto de cada celda/etiqueta (aprox. 120px)
    const barcodeWidth = 50; // Ancho del código de barras visual
    const barcodeHeight = 20; // Alto del código de barras visual
    const margin = 2; // Margen entre etiquetas en milímetros (ajusta si es necesario)

    // Calcular el número total de etiquetas (usando los valores potentially limitados de fila y columna)
    const totalLabels = this.codigoBarrasData.fila * this.codigoBarrasData.columna;

    // Ensure we have the complete talla details, otherwise fall back to an empty string
    // This will be used for drawing the talla text on each label
    // Asegurarse de tener la talla seleccionada para mostrar los detalles completos
    const tallaDisplay = tallaSeleccionadaCompleta
        ? `USA ${tallaSeleccionadaCompleta.usa} — EUR ${tallaSeleccionadaCompleta.eur} — CM ${tallaSeleccionadaCompleta.cm}`
        : '';

    // Propiedades del producto
    // Add null checks for productoParaCodigo
    const productName = this.productoParaCodigo ? this.productoParaCodigo.nombre || '' : '';
    const productPrice = this.productoParaCodigo ? this.productoParaCodigo.precioVenta?.toFixed(2) || '0.00' : '0.00'; // Formatear precio

    // Check if productoParaCodigo is null before proceeding
    if (!this.productoParaCodigo) {
      return; // Exit if product data is not available
    }


    // Iterate to generate each label
    for (let i = 0; i < totalLabels; i++) {
        // Calculate the current row and column for this label (0-based index)
        const row = Math.floor(i / this.codigoBarrasData.columna);
        const col = i % this.codigoBarrasData.columna;

        // Calculate the position of the top-left corner of the current cell on the current page
        // The `y` coordinate needs to be calculated relative to the *top* of the *current page*,
 // considering the height of previous rows and margins.

        // Calculate the vertical position of the row start
 const rowStartY = row * (labelHeight + margin) + margin; // Add margin at the top of each row

        // Calculate the absolute position (x, y) of the current label on the page
        const x = col * (labelWidth + margin) + margin; // Add margin at the start of each column
 const y = rowStartY; // Y position is the start of the row

        // Ensure adding a new page if there's no space for the next label
        if (y + labelHeight > doc.internal.pageSize.height - margin && i > 0) {
          doc.addPage();
          // La lógica de posicionamiento dentro del bucle ya maneja la continuación
          // en la nueva página a través de los cálculos de 'row' y 'col'.
          // No necesitamos ajustar x e y aquí dentro del if.
        }
        // ** Dibujar el recuadro alrededor de toda la etiqueta **
        doc.rect(x, y, labelWidth, labelHeight);
        
        // --- Posicionar el contenido dentro de la celda (usando offsets desde la esquina superior izquierda de la celda) ---
 const innerPaddingX = 1; // Small horizontal padding
 const innerPaddingY = 1; // Small vertical padding

        // Posición del Nombre del Producto (arriba)
        doc.setFontSize(7); // Font size for the name
        const productNameTextWidth = doc.getTextWidth(productName);
 const productNameX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - productNameTextWidth) / 2; // Centered horizontally within padding
 doc.text(productName, productNameX, y + innerPaddingY + 2.5); // Adjust Y offset from the top of the label boundary (y)

        // Posición del Precio (arriba, a la derecha)
 doc.setFontSize(7); // Font size for the price
        const priceTextWidth = doc.getTextWidth(`S/ ${productPrice}`);
        const priceX = x + labelWidth - margin - priceTextWidth; // Alinear a la derecha con margen
        doc.text(`S/ ${productPrice}`, priceX, y + 3.5); // Adjust Y offset from the top of the label

        // Posición del Código de Barras (en el centro)
        // Ajustar este offset para dejar espacio para el nombre, el precio y la talla
        const barcodeAreaYOffset = 6; // Espacio desde el borde superior de la etiqueta hasta el área del código de barras
        const barcodeAreaY = y + barcodeAreaYOffset;

        // Generar el código de barras como un elemento SVG temporal
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svgElement, this.codigoBarrasData.codigoProducto || 'N/A', {
            format: "CODE128", // Asegúrate de que este formato sea correcto (ej: "EAN13", "UPCA")
            width: 2, // Ajusta el grosor de las barras según necesites
            height: barcodeHeight, // Usamos la altura definida (20mm)
            displayValue: false // No mostrar el número debajo del código de barras
        });

        // Convertir el SVG a una imagen (canvas) para jsPDF (requiere canvg)
        const canvas = document.createElement('canvas');
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const ctx = canvas.getContext('2d')!;
        const v = await Canvg.from(ctx, svgString);
        await v.render();

        // Agregar la imagen del código de barras al PDF
        const barcodeDataURL = canvas.toDataURL('image/png');

        // Calcular la posición X para centrar la imagen del código de barras dentro del área de la etiqueta
        const barcodeImageX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - barcodeWidth) / 2; // Centered horizontally within inner padding

        // Agregar la imagen al PDF en la posición calculada
        doc.addImage(barcodeDataURL, 'PNG', barcodeImageX, barcodeAreaY, barcodeWidth, barcodeHeight);

        // Posición del Número del Código de Barras (debajo de la imagen, centrados)
        doc.setFontSize(7); // Font size for the barcode number
        const barcodeNumberText = this.codigoBarrasData.codigoProducto || 'N/A';
 const barcodeNumberTextWidth = doc.getTextWidth(barcodeNumberText);
        const barcodeNumberTextX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - barcodeNumberTextWidth) / 2; // Center horizontally
        // Calculate Y position relative to the bottom of the barcode image
 const barcodeNumberTextY = barcodeAreaY + barcodeHeight + 1; // Calculate Y relative to the label's top (y), then add to y below
        doc.text(barcodeNumberText, barcodeNumberTextX, barcodeNumberTextY);

        // Posición de la Talla (debajo del número del código de barras), ajustando el offset Y
        doc.setFontSize(6); // Font size for size
        // Calculate Y position relative to the bottom of the barcode number text
 const tallaTextY = barcodeNumberTextY + 2.5; // Calculate Y relative to the label's top (y), then add to y below
 const tallaTextWidth = doc.getTextWidth(tallaDisplay);
        // Center the size text horizontally within the label area
        const tallaTextX = x + innerPaddingX + (labelWidth - (innerPaddingX * 2) - tallaTextWidth) / 2;
 doc.text(tallaDisplay, tallaTextX, tallaTextY); // Adjusted position
    }

    // Add null check before accessing productoParaCodigo.nombre in save filename
    const filename = this.productoParaCodigo ? `codigos_barras_${this.productoParaCodigo.nombre}.pdf` : 'codigos_barras.pdf';
    doc.save(filename);

    this.cerrarModalCodigoBarras();
  }



  cerrarModalCodigoBarras(form?: any) { // Accept optional form argument
    this.modalCodigoBarrasAbierto = false;
    this.productoParaCodigo = null;
    this.codigoBarrasData = {
      codigoProducto: '',
      tallaSeleccionada: '',
      fila: 1,
      columna: 1
    };
    // Reset the form if it was passed
    if (form) { form.resetForm(); }
  }

  eliminarProducto(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }
    if (!confirm('¿Deseas eliminar el producto "' + prod.nombre + '"?')) {
      return;
    }

    this.productoService.deleteProducto(prod.idProducto)
      .subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.idProducto !== prod.idProducto);
          this.aplicarFiltro();
          alert('Producto eliminado con éxito');
        },
        error: (err: any) => {
          console.error('Error al eliminar producto:', err);
          alert('Ocurrió un error al eliminar el producto.');
        }
      });
  }

  // Added: method to toggle filter visibility
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}
