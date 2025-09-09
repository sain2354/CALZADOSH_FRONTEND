// src/app/invoice/invoice.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit, OnChanges {
  @Input() ventaData: any | null = null;

  company = {
    name: 'CALZADOS HUANCAYO',
    ruc: '20611360682',
    address: 'AV. FERROCARRIL NRO. 1050 (CENTRO COMERCIAL ECONO PLAZA - STAND A4) JUNIN - HUANCAYO - HUANCAYO',
    phone: '22639 6800',
    email: 'CALZADOSHUANCAYO@gmail.com',
    logo: 'assets/logo.png'
  };

  barcodeValue = '';
  qrValue = '';

  ngOnInit(): void {
    if (this.ventaData && this.ventaData.fecha) this.setFormattedDate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ventaData'] && this.ventaData) {
      this.setFormattedDate();
      setTimeout(() => {
        this.generateBarcode();
        this.generateQr(); // genera solo el QR grande (qrcode-img)
      }, 60);
    }
  }

  private setFormattedDate() {
    try {
      const d = new Date(this.ventaData.fecha);
      this.ventaData.fechaFormateada = d.toLocaleString();
    } catch {
      this.ventaData.fechaFormateada = this.ventaData.fecha ?? '';
    }
  }

  public getSubTotal(): number {
    if (!this.ventaData) return 0;
    if (typeof this.ventaData.subTotal === 'number') return +this.ventaData.subTotal;
    const detalles = this.ventaData.detalles || [];
    const sum = detalles.reduce((acc: number, it: any) => {
      const v = Number(it.total ?? (it.cantidad * it.precio));
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    return +sum.toFixed(2);
  }

  public getIgv(): number {
    if (!this.ventaData) return 0;
    if (typeof this.ventaData.totalIgv === 'number') return +this.ventaData.totalIgv;
    return +((this.getSubTotal() * 0.18)).toFixed(2);
  }

  public getTotal(): number {
    if (!this.ventaData) return 0;
    if (typeof this.ventaData.total === 'number') return +this.ventaData.total;
    const sub = this.getSubTotal();
    const igv = typeof this.ventaData.totalIgv === 'number' ? +this.ventaData.totalIgv : +(sub * 0.18);
    return +(sub + igv).toFixed(2);
  }

  async generateBarcode() {
    if (!this.ventaData) return;
    this.barcodeValue = `${this.ventaData.serie || ''}-${this.ventaData.numeroComprobante || this.ventaData.numero || this.ventaData.id || '00000000'}` || '00000000';
    try {
      const JsBarcodeModule = await import('jsbarcode');
      const JsBarcode: any = (JsBarcodeModule as any).default ?? JsBarcodeModule;
      const canvas = document.getElementById('barcode-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      JsBarcode(canvas, this.barcodeValue, {
        format: 'CODE128',
        displayValue: true,
        height: 36,
        margin: 4,
        fontSize: 10
      });
    } catch (err) {
      console.warn('Error generando barcode:', err);
    }
  }

  async generateQr() {
    if (!this.ventaData) return;
    const content = this.ventaData.qrText || `RUC:${this.company.ruc}|TIPO:${this.ventaData.tipoComprobante || 'BOLETA'}|N:${this.ventaData.serie || ''}-${this.ventaData.numeroComprobante || ''}|TOTAL:${this.getTotal().toFixed(2)}`;
    this.qrValue = content;

    const imgBig = document.getElementById('qrcode-img') as HTMLImageElement | null;

    try {
      const QRModule = await import('qrcode');
      const QR: any = (QRModule as any).default ?? QRModule;
      const bigDataUrl = await QR.toDataURL(content, { width: 95, margin: 1 });
      if (imgBig) { imgBig.src = bigDataUrl; imgBig.style.display = 'block'; imgBig.alt = 'QR comprobante'; }
      return;
    } catch (err) {
      // fallback
    }

    const qrserverBig = `https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(content)}`;
    const googleBig = `https://chart.googleapis.com/chart?cht=qr&chs=95x95&chl=${encodeURIComponent(content)}&chld=M|1`;
    if (imgBig) {
      imgBig.src = qrserverBig;
      imgBig.onerror = () => { imgBig.onerror = null; imgBig.src = googleBig; };
      imgBig.style.display = 'block';
    }
  }

  public async printPopup(format: 'a4' | 'thermal' = 'a4') {
    if (!this.ventaData) return;
    await this.generateBarcode();
    await this.generateQr();

    const bc = document.getElementById('barcode-canvas') as HTMLCanvasElement | null;
    const bcData = bc ? bc.toDataURL('image/png') : '';
    const qrImg = document.getElementById('qrcode-img') as HTMLImageElement | null;
    const qrData = qrImg ? qrImg.src : '';

    const content = (document.getElementById('invoice-print') as HTMLElement)?.innerHTML || '';
    const contentWithImgs = content
      .replace(/<canvas[^>]*id="barcode-canvas"[^>]*>[\s\S]*?<\/canvas>/i, bcData ? `<img src="${bcData}" class="barcode-img" alt="barcode" />` : '')
      .replace(/<img[^>]*id="qrcode-img"[^>]*>/i, qrData ? `<img id="qrcode-img" src="${qrData}" class="qrcode-img" alt="qr" />` : '');

    const popup = window.open('', '_blank', 'width=900,height=900');
    if (!popup) return;

    const baseStyles = `
      html,body{height:100%;}
      body{font-family: 'Poppins', sans-serif; margin:6px; color:#1b2935;}
      .invoice-wrapper{background:#fff;padding:6px;font-size:12px; max-width:190mm; box-sizing:border-box;}
      table{width:100%;border-collapse:collapse;}
      th,td{padding:6px;border-bottom:1px solid #eaeaea;}
      body, .invoice-wrapper { -webkit-print-color-adjust: exact; }
    `;

    const a4Styles = `
      @page{ size:A4; margin:8mm; }
      body{font-size:11px; margin:0;}
      .company-name-top { font-size: 56px !important; font-weight: 900 !important; color: #b71c1c !important; text-align: center !important; display: block !important; margin: 0 !important; padding: 0 !important; line-height: 0.95 !important; letter-spacing: 2px !important; text-shadow: 0 3px 6px rgba(0,0,0,0.12) !important; }
      .company-legal-top { font-size: 11px !important; text-align:center !important; margin: 2px 0 6px 0 !important; }
      .top-banner { margin: 0 0 4px 0 !important; padding:0 !important; }
      .rut-box { padding: 4px 6px !important; margin:0 !important; border-width:1.2px !important; }
      .inv-header { margin: 0 0 2px 0 !important; padding: 0 !important; }
      .company-meta, .company-meta.small { margin: 0 !important; padding: 0 !important; line-height: 1 !important; font-size: 10px !important; }
      .section-divider { margin: 4px 0 !important; border-top-width: 1px !important; }
      .client-info { margin: 0 0 4px 0 !important; padding: 0 !important; font-size: 11px !important; }
      .items-table th, .items-table td { padding-top: 3px !important; padding-bottom: 3px !important; font-size: 10px !important; }
      .totals { margin-top: 4px !important; font-size: 11px !important; }
      /* Contenedor del QR: Centra su contenido en línea */
      .qr-section { margin-top: 6px !important; page-break-inside: avoid !important; break-inside: avoid !important; text-align: center !important; }
      .inv-footer { margin-top: 8px !important; page-break-inside: avoid !important; text-align:center !important; }
      /* Imagen QR: Se comporta como bloque en línea para obedecer el centrado del padre */
      #qrcode-img { display: inline-block !important; width: 95px !important; height: 95px !important; margin-top: 4px !important; }
      .invoice-wrapper { padding: 4px !important; max-height: 270mm !important; overflow: visible !important; }
      .company-name-top, .invoice-wrapper, .client-info, .items-table, .qr-section, .inv-footer { -webkit-print-color-adjust: exact !important; }
    `;

    const thermalStyles = ` @page{ size:80mm auto; margin:4mm; } body{width:80mm; font-size:11px;} `;

    const styles = baseStyles + (format === 'thermal' ? thermalStyles : a4Styles);

    popup.document.write(`
      <html>
        <head>
          <title>Comprobante - ${this.ventaData.serie || ''}-${this.ventaData.numeroComprobante || ''}</title>
          <meta charset="utf-8"/>
          <style>${styles}</style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${contentWithImgs}
            <div style="text-align:center; margin-top:6px;">
              
            </div>
          </div>
        </body>
      </html>`);
    popup.document.close();

    setTimeout(() => { popup.focus(); popup.print(); }, 350);
  }

  public async generatePdfAutoTable() {
    if (!this.ventaData) return;
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFontSize(14);
    doc.text(this.company.name, 14, 18);
    doc.setFontSize(9);
    doc.text(`RUC: ${this.company.ruc}`, 14, 24);
    doc.text(this.company.address, 14, 29);
    doc.text(`Tel: ${this.company.phone} ${this.company.email ? ' | ' + this.company.email : ''}`, 14, 34);

    const docTitle = `${this.ventaData.serie || ''}-${this.ventaData.numeroComprobante || ''}`;
    doc.setFontSize(11);
    doc.text(docTitle, 150, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Fecha: ${this.ventaData.fechaFormateada || this.ventaData.fecha || ''}`, 150, 26, { align: 'right' });

    const body = (this.ventaData.detalles || []).map((it: any, idx: number) => [
      String(idx + 1),
      it.ean || it.codigo || '-',
      it.descripcion || it.nombre || '-',
      (it.cantidad ?? 0).toString(),
      (it.precio ?? 0).toFixed(2),
      (it.desc ?? it.descuento ?? 0).toFixed(2)
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['#', 'DESCRIPCION', 'CANT', 'P. UNIT.', 'DESC']],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 0, 0] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 110;
    const sub = this.getSubTotal();
    const igv = this.getIgv();
    const total = this.getTotal();

    doc.setFontSize(10);
    doc.text(`SUBTOTAL: ${this.ventaData.moneda || 'S/'} ${sub.toFixed(2)}`, 150, finalY + 8, { align: 'right' });
    doc.text(`IGV: ${this.ventaData.moneda || 'S/'} ${igv.toFixed(2)}`, 150, finalY + 15, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`TOTAL: ${this.ventaData.moneda || 'S/'} ${total.toFixed(2)}`, 150, finalY + 24, { align: 'right' });

    doc.save(`comprobante_${docTitle || this.ventaData.numeroComprobante || this.ventaData.id}.pdf`);
  }

  public async generatePdfFromHtml() {
    if (!this.ventaData) return;
    const element = document.getElementById('invoice-print');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    } else {
      const scale = pageHeight / pdfHeight;
      const newWidth = pdfWidth * scale;
      const newHeight = pageHeight;
      const xOffset = (pdfWidth - newWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 0, newWidth, newHeight);
    }

    pdf.save(`boleta-${this.ventaData.numeroComprobante || this.ventaData.id}.pdf`);
  }
}
