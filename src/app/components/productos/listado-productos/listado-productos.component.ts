import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';

import { ProductoService } from '../../../services/producto.service';
import { TallaService } from '../../../services/talla.service';
import { TallaProductoService } from '../../../services/talla-producto.service';
import { Producto } from '../../../models/producto.model';
import { Talla } from '../../../models/talla.model';

@Component({
  selector: 'app-listado-productos',
  standalone: true,
  imports: [
    CommonModule,          // *ngIf, *ngFor, ngClass...
    FormsModule,           // [(ngModel)]
    NgxPaginationModule,   // paginate pipe/directive
    AutocompleteLibModule  // <ng-autocomplete>
  ],
  templateUrl: './listado-productos.component.html',
  styleUrls: ['./listado-productos.component.css']
})
export class ListadoProductosComponent implements OnInit {
  // ============ PAGINACIÓN Y FILTROS ============
  page: number = 1;
  pageSize: number = 10;
  totalRegistros: number = 0;
  selectedCategory: number = 0; // 0 => Todos, 1 => Hombres, 2 => Mujeres, 3 => Infantil

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
  tallasSeleccionadas: {
    idTalla: number;
    descripcionTalla: string;
    stock: number;
  }[] = [];

  // Aquí guardaremos el archivo seleccionado (en vez de usar base64)
  archivoSeleccionado: File | null = null;

  constructor(
    private productoService: ProductoService,
    private tallaService: TallaService,
    private tallaProductoService: TallaProductoService
  ) {}

  ngOnInit(): void {
    this.cargarTallas();
    this.cargarProductos();
  }

  // ============ CARGAR PRODUCTOS (FILTRADO POR cat) SIN PAGINACIÓN DEL SERVIDOR ============
  cargarProductos() {
    this.productoService.getAll(this.selectedCategory).subscribe({
      next: (lista) => {
        this.productos = lista;

        // Para Autocomplete
        this.productosAutoComplete = this.productos.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          categoria: p.categoria
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

  onCategoryChange(cat: number) {
    this.selectedCategory = cat;
    this.page = 1;
    this.cargarProductos();
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

  // ============ TALLAS Y SUBCATEGORÍAS ============
  cargarTallas() {
    this.tallaService.getAllTallas().subscribe({
      next: (data) => {
        this.tallasDisponibles = data;
      },
      error: (err: any) => {
        console.error('Error al cargar tallas:', err);
      }
    });
  }

  // Filtro local (texto)
  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(texto) ||
        p.categoria?.toLowerCase().includes(texto)
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

  // ============ MODAL ============
  abrirModal() {
    this.modalAbierto = true;
    this.subcategoriasFiltradas = [];
    this.producto = this.nuevoProducto();
    // Asignamos valor por defecto a shippingInfo
    this.producto.shippingInfo = 'Envíos a nivel nacional, precio de delivery no incluido';
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.producto = this.nuevoProducto();
    this.tallasSeleccionadas = [];
    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
    this.archivoSeleccionado = null;
  }

  guardarProducto() {
    const formData = new FormData();

  // Añadimos las propiedades del producto como campos
    formData.append('IdCategoria', String(this.producto.idCategoria ?? 0));
    if (this.producto.idSubCategoria) {
      formData.append('IdSubCategoria', String(this.producto.idSubCategoria));
    }
    formData.append('CodigoBarra', this.producto.codigoBarra ?? '');
    formData.append('Nombre', this.producto.nombre ?? '');
    formData.append('Stock', String(this.producto.stock ?? 0));
    formData.append('StockMinimo', String(this.producto.stockMinimo ?? 0));
    formData.append('PrecioVenta', String(this.producto.precioVenta ?? 0));

    // Si precioCompra es opcional
    if (this.producto.precioCompra != null) {
      formData.append('PrecioCompra', String(this.producto.precioCompra));
    }
    formData.append('IdUnidadMedida', String(this.producto.idUnidadMedida ?? 0));
    formData.append('Estado', this.producto.estado ? 'true' : 'false');

    // — Nuevos campos —
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

    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }


    this.productoService.crearProductoConArchivo(formData).subscribe({
      next: (productoCreado) => {
        
        console.log('Producto creado con éxito:', productoCreado);

        // Asociar tallas (si hay) una vez creado el producto
        if (this.tallasSeleccionadas.length > 0 && productoCreado.idProducto) {
          this.guardarTallasProducto(productoCreado.idProducto);
        } else {
          this.cargarProductos();
          this.cerrarModal();
        }
      },

      error: (error: any) => {
        console.error('Error al guardar el producto:', error);
      }
    });
  }

  private nuevoProducto(): Producto {
    return {
      idProducto: 0,
      codigoBarra: '',
      idCategoria: 0,
      idSubCategoria: 0,
      nombre: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      stockMinimo: 0,
      idUnidadMedida: 0,
      estado: true,
      foto: '',
      // inicializamos nuevos campos
      mpn: '',
      shippingInfo: '',
      material: '',
      color: ''
    };
  }

  // ============ GUARDAR TALLAS ============
  guardarTallasProducto(idProducto: number) {
    let pendientes = this.tallasSeleccionadas.length;

    this.tallasSeleccionadas.forEach((tallaItem) => {
      const request = {
        idProducto,
        idTalla: tallaItem.idTalla,
        stock: tallaItem.stock
      };

      this.tallaProductoService.createTallaProducto(request).subscribe({
        next: () => {
          pendientes--;
          if (pendientes === 0) {
            this.cargarProductos();
            this.cerrarModal();
          }
        },
        error: (err: any) => {
          console.error('Error al asociar TallaProducto:', err);
          pendientes--;
          if (pendientes === 0) {
            this.cargarProductos();
            this.cerrarModal();
          }
        }
      });
    });
  }

  // ============ AGREGAR TALLA ============
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
      descripcionTalla: tallaEncontrada.descripcion,
      stock: this.stockTallaSeleccionada
    });

    this.tallaSeleccionadaId = 0;
    this.stockTallaSeleccionada = 0;
  }

  eliminarTalla(index: number) {
    this.tallasSeleccionadas.splice(index, 1);
  }

  // ============ SUBCATEGORÍAS ============
  actualizarSubcategorias() {
    this.subcategoriasFiltradas = this.subcategorias.filter(
      (s) => s.idCategoria === Number(this.producto.idCategoria)
    );
    this.producto.idSubCategoria = 0;
  }

  // Aquí simplemente guardamos el archivo en una variable (sin usar Base64)
  manejarFoto(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
    }
  }

  
  // ============ OPCIONES (Editar, Stock, etc.) ============
  editarProducto(prod: Producto) {
    console.log('Editar producto:', prod);
  }

  aumentarStock(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }

    const cantidad = prompt('¿Cuántas unidades deseas sumar al stock?');
    if (!cantidad) return;

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Cantidad inválida.');
      return;
    }

    const nuevaCantidad = (prod.stock || 0) + cantNum;
    const productoActualizado = { ...prod, stock: nuevaCantidad };
    this.productoService.updateProducto(prod.idProducto, productoActualizado)
      .subscribe({
        next: () => {
          prod.stock = nuevaCantidad;
          alert('Stock aumentado correctamente');
        },
        error: (err) => {
          console.error('Error al aumentar stock:', err);
        }
      });
  }

  disminuirStock(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }

    const cantidad = prompt('¿Cuántas unidades deseas restar del stock?');
    if (!cantidad) return;

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Cantidad inválida.');
      return;
    }

    const nuevaCantidad = (prod.stock || 0) - cantNum;
    if (nuevaCantidad < 0) {
      alert('No puedes dejar el stock en negativo.');
      return;
    }

    const productoActualizado = { ...prod, stock: nuevaCantidad };
    this.productoService.updateProducto(prod.idProducto, productoActualizado)
      .subscribe({
        next: () => {
          prod.stock = nuevaCantidad;
          alert('Stock disminuido correctamente');
        },
        error: (err) => {
          console.error('Error al disminuir stock:', err);
        }
      });
  }

  generarCodigoBarras(prod: Producto) {
    console.log('Generar código de barras para:', prod);
  }

  eliminarProducto(prod: Producto) {
    if (!prod.idProducto) {
      alert('No se encontró la ID del producto.');
      return;
    }
    if (!confirm(`¿Deseas eliminar el producto "${prod.nombre}"?`)) {
      return;
    }

    this.productoService.deleteProducto(prod.idProducto)
      .subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.idProducto !== prod.idProducto);
          this.aplicarFiltro();
          alert('Producto eliminado con éxito');
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          alert('Ocurrió un error al eliminar el producto.');
        }
      });
  }
}