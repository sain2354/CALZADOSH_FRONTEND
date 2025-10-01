import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// --- Interfaces para una estructura de datos clara ---
interface ShippingDetails {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  direccion: string;
  referencia?: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

interface CheckoutData {
  shippingOption: 'tienda' | 'domicilio';
  shippingDetails: ShippingDetails | null;
}

@Component({
  selector: 'app-order-summary-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-summary-page.component.html',
  styleUrls: ['./order-summary-page.component.css']
})
export class OrderSummaryPageComponent implements OnInit {

  private router = inject(Router);

  // Esta variable contendrá los datos del paso anterior.
  public checkoutData: CheckoutData | null = null;

  ngOnInit(): void {
    // --- SIMULACIÓN DE DATOS ---
    // Por ahora, simularemos que recibimos los datos de un servicio.
    // Más adelante, reemplazaremos esto con una llamada a un servicio real (ej: CheckoutService).
    const simulatedDataFromService = {
      shippingOption: 'domicilio' as const,
      shippingDetails: {
        nombre: 'Sain',
        apellido: 'Quinto',
        dni: '12345678',
        telefono: '987654321',
        direccion: 'Av. Los Girasoles 123',
        referencia: 'Casa con puerta azul, frente al parque',
        distrito: 'Chilca',
        provincia: 'Huancayo',
        departamento: 'Junín'
      }
    };

    this.checkoutData = simulatedDataFromService;
    
    // Si por alguna razón no hay datos, redirigimos al usuario para que no vea una página vacía.
    if (!this.checkoutData) {
      console.warn('No se encontraron datos de checkout. Redirigiendo a la página de envío.');
      this.router.navigate(['/checkout']);
    }
  }

  /**
   * Esta función se activará al hacer clic en "Confirmar y Pagar".
   * Por ahora, solo mostrará un mensaje. En el futuro, aquí se iniciará
   * la integración con la pasarela de pagos (Mercado Pago).
   */
  proceedToPayment(): void {
    console.log('Iniciando proceso de pago...');
    console.log('Datos finales del pedido:', this.checkoutData);
    
    // Futuro: Redirigir a Mercado Pago o ejecutar su SDK.
    alert('TODO: Implementar la pasarela de pago. Por ahora, el flujo termina aquí.');
  }
}
