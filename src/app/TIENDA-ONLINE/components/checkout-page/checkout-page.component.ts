import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CheckoutService, VentaRequest, DireccionEntregaRequest } from '../../services/checkout.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private checkoutService = inject(CheckoutService);

  selectedShippingOption: 'tienda' | 'domicilio' = 'domicilio';
  shippingForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.shippingForm = this.fb.group({
      // Se añade el campo alias al formulario de dirección
      alias: ['Casa'], // Valor por defecto
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-h-9]{9}$/)]],
      departamento: ['Junín', Validators.required],
      provincia: ['Huancayo', Validators.required],
      distrito: ['Huancayo', Validators.required],
      direccion: ['', Validators.required],
      referencia: [''],
    });
    this.updateFormValidation();
  }

  selectShippingOption(option: 'tienda' | 'domicilio'): void {
    this.selectedShippingOption = option;
    this.updateFormValidation();
  }

  private updateFormValidation(): void {
    // Lógica de validación (no necesita cambios en este paso)
    const fields = ['nombre', 'apellido', 'dni', 'telefono', 'departamento', 'provincia', 'distrito', 'direccion', 'alias'];
    if (this.selectedShippingOption === 'domicilio') {
        fields.forEach(field => {
            this.shippingForm.get(field)?.setValidators(Validators.required);
            if (field === 'dni') this.shippingForm.get(field)?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
            if (field === 'telefono') this.shippingForm.get(field)?.setValidators([Validators.required, Validators.pattern(/^[0-9]{9}$/)]);
        });
        this.shippingForm.get('referencia')?.clearValidators(); // Referencia es opcional
    } else {
        Object.keys(this.shippingForm.controls).forEach(key => {
            this.shippingForm.get(key)?.clearValidators();
        });
    }
    Object.keys(this.shippingForm.controls).forEach(key => this.shippingForm.get(key)?.updateValueAndValidity());
  }

  handleSubmit(): void {
    if (this.selectedShippingOption === 'domicilio' && this.shippingForm.invalid) {
      console.error('El formulario de envío es inválido.');
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // --- INICIO DE LA MODIFICACIÓN ---
    // Se actualiza la construcción del objeto para que coincida con el backend.

    let direccionRequest: DireccionEntregaRequest | null = null;
    if (this.selectedShippingOption === 'domicilio') {
      const formValue = this.shippingForm.value;
      direccionRequest = {
        alias: formValue.alias,
        nombreDestinatario: formValue.nombre,
        apellidoDestinatario: formValue.apellido,
        dniDestinatario: formValue.dni,
        telefonoDestinatario: formValue.telefono,
        departamento: formValue.departamento,
        provincia: formValue.provincia,
        distrito: formValue.distrito,
        direccion: formValue.direccion,
        referencia: formValue.referencia,
        costoEnvio: 15.00 // TODO: Calcular costo de envío real
      };
    }

    const ventaRequest: VentaRequest = {
      idUsuario: 33, // TODO: Obtener dinámicamente del servicio de autenticación
      tipoComprobante: 'Boleta', // TODO: Permitir al usuario elegir
      direccionEntrega: direccionRequest,
      // Se añade `idTalla` a los datos simulados del carrito.
      detallesVenta: [
        { idProducto: 1, idTalla: 2, cantidad: 2, precioUnitario: 50.00 }, // Talla M para producto 1
        { idProducto: 2, idTalla: 4, cantidad: 1, precioUnitario: 120.00 } // Talla L para producto 2
      ],
      subtotal: 220.00, // TODO: Calcular desde un servicio de carrito
      igv: 39.60,      // TODO: Calcular desde un servicio de carrito
      total: 259.60     // TODO: Calcular desde un servicio de carrito
    };
    // --- FIN DE LA MODIFICACIÓN ---

    this.checkoutService.crearVenta(ventaRequest).subscribe({
      next: (response) => {
        console.log('¡Venta creada con éxito en el backend!', response);
        alert(`Venta registrada con éxito. ID de Venta: ${response.idVenta}`);
        this.isLoading = false;
        this.router.navigate(['/pago', { ventaId: response.idVenta }]);
      },
      error: (err) => {
        console.error('Error al crear la venta:', err);
        alert('Hubo un error al registrar el pedido. Por favor, revisa los datos o inténtalo más tarde.');
        this.isLoading = false;
      }
    });
  }
}
