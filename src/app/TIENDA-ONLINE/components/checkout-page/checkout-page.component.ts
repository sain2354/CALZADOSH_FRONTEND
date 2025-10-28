
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

import { CheckoutService, VentaRequest, DireccionEntregaRequest, VentaResponse } from '../../services/checkout.service';
import { UsuarioDireccionService, UsuarioDireccionRequest, UsuarioDireccionResponse } from '../../services/usuario-direccion.service';
import { AuthTiendaService } from '../../services/auth-tienda.service';
import { CartService, CartItem } from '../../services/cart.service';

// --- INTEGRACIÓN UBIGEO ---
import { UbigeoService } from '../../services/ubigeo.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css'],
  providers: [CheckoutService, UsuarioDireccionService] 
})
export class CheckoutPageComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private checkoutService = inject(CheckoutService);
  private usuarioDireccionService = inject(UsuarioDireccionService);
  private authService = inject(AuthTiendaService);
  private cartService = inject(CartService);
  // --- INTEGRACIÓN UBIGEO ---
  private ubigeoService = inject(UbigeoService);

  selectedShippingOption: 'tienda' | 'domicilio' = 'domicilio';
  shippingForm!: FormGroup;
  isLoading = false;
  userId: number | null = null;
  cartItems: CartItem[] = [];

  // --- INTEGRACIÓN UBIGEO ---
  departamentos$!: Observable<string[]>;
  provincias$!: Observable<string[]>;
  distritos$!: Observable<string[]>;

  ngOnInit(): void {
    this.userId = this.authService.currentUserId;
    if (!this.userId) {
        console.error('Error: Usuario no autenticado.');
        this.router.navigate(['/auth']);
        return;
    }

    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      if (items.length === 0) {
        console.warn('El carrito está vacío, redirigiendo a la tienda.');
      }
    });

    this.shippingForm = this.fb.group({
      alias: ['Casa'],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8,9}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      // --- MODIFICACIÓN UBIGEO ---
      departamento: [null, Validators.required],
      provincia: [{ value: null, disabled: true }, Validators.required],
      distrito: [{ value: null, disabled: true }, Validators.required],
      // --- FIN MODIFICACIÓN UBIGEO ---
      direccion: ['', Validators.required],
      referencia: [''],
    });
    
    // --- INTEGRACIÓN UBIGEO ---
    this.departamentos$ = this.ubigeoService.getDepartamentos();
    this.updateFormValidation();
  }

  // --- NUEVO MÉTODO UBIGEO ---
  onDepartamentoChange(): void {
    const departamento = this.shippingForm.get('departamento')?.value;
    
    // Resetea y deshabilita los selects dependientes
    this.shippingForm.get('provincia')?.reset({ value: null, disabled: true });
    this.shippingForm.get('distrito')?.reset({ value: null, disabled: true });
    this.provincias$ = of([]); // Limpia la lista anterior
    this.distritos$ = of([]);  // Limpia la lista anterior

    if (departamento) {
      this.provincias$ = this.ubigeoService.getProvincias(departamento);
      this.shippingForm.get('provincia')?.enable();
    }
  }

  // --- NUEVO MÉTODO UBIGEO ---
  onProvinciaChange(): void {
    const departamento = this.shippingForm.get('departamento')?.value;
    const provincia = this.shippingForm.get('provincia')?.value;
    
    // Resetea y deshabilita el select de distrito
    this.shippingForm.get('distrito')?.reset({ value: null, disabled: true });
    this.distritos$ = of([]); // Limpia la lista anterior

    if (departamento && provincia) {
      this.distritos$ = this.ubigeoService.getDistritos(departamento, provincia);
      this.shippingForm.get('distrito')?.enable();
    }
  }

  selectShippingOption(option: 'tienda' | 'domicilio'): void {
    this.selectedShippingOption = option;
    this.updateFormValidation();
  }

  private updateFormValidation(): void {
    const fields = ['nombre', 'apellido', 'dni', 'telefono', 'departamento', 'provincia', 'distrito', 'direccion', 'alias'];
    if (this.selectedShippingOption === 'domicilio') {
      fields.forEach(field => {
        this.shippingForm.get(field)?.setValidators(Validators.required);
      });
    } else {
      fields.forEach(field => {
        this.shippingForm.get(field)?.clearValidators();
      });
    }
    Object.keys(this.shippingForm.controls).forEach(key => this.shippingForm.get(key)?.updateValueAndValidity());
  }

  handleSubmit(): void {
    if (this.selectedShippingOption === 'domicilio' && this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }
    if (!this.userId) {
      alert('Debes iniciar sesión para continuar.');
      return;
    }
    if (this.cartItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    this.isLoading = true;

    const saveAddress$: Observable<UsuarioDireccionResponse | null> = this.selectedShippingOption === 'domicilio'
      ? this.saveUserAddress(this.userId)
      : of(null);

    saveAddress$.pipe(
      switchMap((savedAddress: UsuarioDireccionResponse | null) => this.createVenta(this.userId!, savedAddress)),
      catchError(err => {
        console.error('Ocurrió un error en el proceso de pago:', err);
        alert('No se pudo completar el pedido. Por favor, inténtalo de nuevo.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((ventaResponse: VentaResponse | null) => {
      if (ventaResponse) {
        console.log('¡Venta creada con éxito!', ventaResponse);
        alert(`Pedido registrado con éxito. ID: ${ventaResponse.idVenta}`);
        this.isLoading = false;
        this.cartService.clearCart();
        this.router.navigate(['/pago', { ventaId: ventaResponse.idVenta }]);
      }
    });
  }

  private saveUserAddress(userId: number): Observable<UsuarioDireccionResponse> {
    const formValue = this.shippingForm.value;
    const direccionReq: UsuarioDireccionRequest = {
      idUsuario: userId,
      alias: formValue.alias,
      departamento: formValue.departamento,
      provincia: formValue.provincia,
      distrito: formValue.distrito,
      direccion: formValue.direccion,
      referencia: formValue.referencia
    };
    return this.usuarioDireccionService.crearDireccion(direccionReq);
  }

  private createVenta(userId: number, savedAddress: UsuarioDireccionResponse | null): Observable<VentaResponse> {
    let direccionEntrega: DireccionEntregaRequest | null = null;
    if (this.selectedShippingOption === 'domicilio') {
        if (!savedAddress) throw new Error('La dirección del usuario no se guardó correctamente.');
        const formValue = this.shippingForm.value;
        direccionEntrega = {
            nombreDestinatario: formValue.nombre,
            apellidoDestinatario: formValue.apellido,
            dniDestinatario: formValue.dni,
            telefonoDestinatario: formValue.telefono,
            departamento: savedAddress.departamento,
            provincia: savedAddress.provincia,
            distrito: savedAddress.distrito,
            direccion: savedAddress.direccion,
            referencia: savedAddress.referencia,
            costoEnvio: 15.00
        };
    }

    const detallesVenta = this.cartItems.map(item => ({
      idProducto: item.product.idProducto,
      tallaUsa: item.selectedSize.usa, 
      cantidad: item.quantity,
      Precio: item.product.precioVenta
    } as any));

    const subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.precioVenta * item.quantity), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const ventaRequest: VentaRequest = {
      idUsuario: userId,
      tipoComprobante: 'Boleta',
      direccionEntrega: direccionEntrega,
      detallesVenta: detallesVenta,
      subtotal: parseFloat(subtotal.toFixed(2)),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
    
    console.log('Enviando datos a la ruta corregida:', ventaRequest);

    return this.checkoutService.crearVenta(ventaRequest);
  }
}
