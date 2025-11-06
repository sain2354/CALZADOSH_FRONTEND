// src/app/components/detalle-pedido/detalle-pedido.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido, Pago } from '../../../models/pedido.model';
import { ComprobantePagoComponent } from './comprobante-pago.component';
import { PagoService } from '../../../services/pago.service';
import Swal from 'sweetalert2';

// Importaciones para PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [CommonModule, ComprobantePagoComponent],
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.css']
})
export class DetallePedidoComponent {
  @Input() pedido!: Pedido;
  @Output() cerrar = new EventEmitter<void>();
  @Output() pagoActualizado = new EventEmitter<void>();
  mostrarComprobante = false;
  comprobanteUrl?: string;
  metodoPago?: string;

  constructor(private pagoService: PagoService) {}

  // =====================================================
  //      NUEVA FUNCIÓN PARA GENERAR LA BOLETA EN PDF
  // =====================================================
  generarBoletaPDF() {
    const doc = new jsPDF();
    const pedido = this.pedido;

    // --- 1. Información de la Empresa ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Calzados Huancayo', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Dirección: Av. FERROCARIL 123, Huancayo', 20, 26);
    doc.text('RUC: 20123456789', 20, 30);
    doc.text('Teléfono: (+51) 960926073', 20, 34);

    // --- 2. Título de la Boleta ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Boleta de Envío - Pedido #${pedido.idVenta}`, 20, 45);

    // --- 3. Datos para el Envío ---
    let y = 55;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos para el Envío', 20, y);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2); // Línea separadora
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Recibe: ${pedido.cliente?.nombreCompleto || 'N/A'}`, 20, y);
    doc.text(`DNI: ${pedido.cliente?.dni || 'N/A'}`, 120, y);
    y += 6;
    doc.text(`Teléfono: ${pedido.cliente?.telefono || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Departamento: ${pedido.direccionEntrega?.departamento || 'N/A'}`, 20, y);
    doc.text(`Provincia: ${pedido.direccionEntrega?.provincia || 'N/A'}`, 120, y);
    y += 6;
    doc.text(`Distrito: ${pedido.direccionEntrega?.distrito || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Dirección: ${pedido.direccionEntrega?.direccion || 'N/A'}`, 20, y);
    y += 6;
    if (pedido.direccionEntrega?.referencia) {
        doc.text(`Referencia: ${pedido.direccionEntrega.referencia}`, 20, y);
        y += 6;
    }
    y += 4; // Espacio

    // --- 4. Resumen del Pedido (Tabla de productos) ---
    const tableData = pedido.detalles.map(d => [
        d.nombreProducto,
        d.talla,
        d.cantidad,
        `S/ ${d.precio.toFixed(2)}`,
        `S/ ${d.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Producto', 'Talla', 'Cant.', 'P. Unitario', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [34, 49, 63] } // Azul oscuro
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;

    // --- 5. Totales ---
    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Costo Envío:', 140, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`S/ ${pedido.costoEnvio.toFixed(2)}`, 175, finalY, { align: 'right' });
    
    finalY += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Pagado:', 140, finalY);
    doc.text(`S/ ${pedido.total.toFixed(2)}`, 175, finalY, { align: 'right' });

    // --- 6. Información de Pago ---
    y = finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información de Pago', 20, y);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (pedido.pagos && pedido.pagos.length > 0) {
        const pago = pedido.pagos[0];
        const metodo = pago.nombreMedioPago || this.getMetodoPagoNombre(pago.idMedioPago);
        doc.text(`Método: ${metodo}`, 20, y);
        y += 6;
        if (pago.idTransaccionMP) {
            doc.text(`ID Transacción: ${pago.idTransaccionMP}`, 20, y);
            y += 6;
        }
        doc.text(`Fecha de Pago: ${this.formatearFechaIso(pago.fechaPago)}`, 20, y);
    } else {
        doc.text('No hay información de pago registrada.', 20, y);
    }

    // --- 7. Guardar el PDF ---
    doc.save(`Boleta-Pedido-${pedido.idVenta}.pdf`);
  }

  getMetodoPagoNombre(id: number): string {
    switch (id) {
        case 1: return 'Yape';
        case 2: return 'Plin';
        case 3: return 'Transferencia';
        case 4: return 'Mercado Pago';
        default: return 'Desconocido';
    }
  }

  // --- Métodos existentes (sin cambios) ---
  abrirComprobante(p: Pago) {
    this.comprobanteUrl = p.comprobanteUrl!;
    this.metodoPago = this.getMetodoPagoNombre(p.idMedioPago);
    this.mostrarComprobante = true;
  }

  formatearFechaIso(f: string): string {
    return new Date(f).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  async validarPago(p: Pago) {
    const result = await Swal.fire({
      title: 'Validar pago',
      text: '¿Estás seguro de validar este pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, validar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.pagoService.validarPago(p.idPago).subscribe({
        next: () => {
          p.estadoPago = 'Pago Validado';
          this.pedido.estadoPago = 'PAGO VALIDADO';
          this.pagoActualizado.emit();
          Swal.fire({
            icon: 'success',
            title: 'Pago validado',
            text: 'El pago ha sido validado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error validando pago:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo validar el pago. Por favor, intenta nuevamente.',
            confirmButtonColor: '#00bcd4'
          });
        }
      });
    }
  }

  async rechazarPago(p: Pago) {
    const result = await Swal.fire({
      title: 'Rechazar pago',
      text: '¿Estás seguro de rechazar este pago?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.pagoService.rechazarPago(p.idPago).subscribe({
        next: () => {
          p.estadoPago = 'Rechazado';
          this.pedido.estadoPago = 'RECHAZADO';
          this.pagoActualizado.emit();
          Swal.fire({
            icon: 'success',
            title: 'Pago rechazado',
            text: 'El pago ha sido rechazado correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error rechazando pago:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo rechazar el pago. Por favor, intenta nuevamente.',
            confirmButtonColor: '#00bcd4'
          });
        }
      });
    }
  }
}
