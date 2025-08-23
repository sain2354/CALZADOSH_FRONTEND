// src/app/models/medio-pago.model.ts
export interface MedioPago {
  idMedioPago: number;
  descripcion: string; // Coincide con la propiedad 'Descripcion' en MedioPagoResponse del backend
  titular?: string; // Opcional, si el titular no siempre está presente
}
