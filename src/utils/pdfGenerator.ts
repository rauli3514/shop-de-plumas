import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';
import type { Sale, DeliveryNote, Product } from '../types';
import { COMPANY_INFO } from '../config/company';

export const savePdfExplicitly = (doc: jsPDF, filename: string) => {
    const safeName = filename.replace(/[^a-z0-9\-\.]/gi, '_');
    const finalName = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getLogoLight = async (): Promise<string | null> => {
    try {
        const response = await fetch(COMPANY_INFO.logoLightUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error loading light logo", e);
        return null;
    }
};


export const generateProductLabelPDF = async (product: Product) => {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
        id: product.id,
        code: product.code,
        name: product.name
    }));
    const logoDataUrl = await getLogoLight();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [60, 40] });
    if (logoDataUrl) { doc.addImage(logoDataUrl, 'JPEG', 45, 2, 12, 12); }
    doc.addImage(qrDataUrl, 'PNG', 2, 5, 20, 20);
    doc.setFontSize(8);
    doc.text(product.name.substring(0, 20), 24, 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(product.code, 24, 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(product.color || '', 24, 20);
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text(COMPANY_INFO.name, 24, 38);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(1, 1, 58, 38);
    savePdfExplicitly(doc, `Etiqueta-${product.code}`);
};


export const generateSalePDF = async (sale: Sale) => {
    const doc = new jsPDF();
    const logoDataUrl = await getLogoLight();

    if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'JPEG', 85, 5, 40, 40);
    }

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('RECIBO DE VENTA', 105, 48, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Documento no válido como factura', 105, 54, { align: 'center' });

    const saleDate = format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: es });

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(15, 60, 195, 60);

    let yPos = 68;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprobante:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.saleNumber, 45, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 110, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(saleDate, 130, yPos);

    yPos += 10;
    doc.line(15, yPos, 195, yPos);

    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(COMPANY_INFO.name, 15, yPos);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    yPos += 5;
    doc.text(COMPANY_INFO.receiptHeader, 15, yPos);
    yPos += 4;
    doc.text(COMPANY_INFO.address, 15, yPos);
    yPos += 4;
    doc.text(COMPANY_INFO.city + ', ' + COMPANY_INFO.province, 15, yPos);
    yPos += 4;
    doc.text('Instagram: ' + COMPANY_INFO.email, 15, yPos);
    yPos += 4;
    doc.text('Tel: ' + COMPANY_INFO.phone, 15, yPos);

    yPos = 86;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 120, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    yPos += 5;
    doc.text(sale.customerName, 120, yPos);
    yPos += 4;
    const splitAddress = doc.splitTextToSize(sale.customerAddress, 75);
    doc.text(splitAddress, 120, yPos);

    const tableData = sale.items.map(item => [
        item.productName,
        item.quantity.toString(),
        '$' + item.unitPrice.toFixed(2),
        '$' + item.subtotal.toFixed(2),
    ]);

    autoTable(doc, {
        startY: 116,
        head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        styles: { textColor: 0, fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { halign: 'center', cellWidth: 25 },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'right', cellWidth: 35 }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, finalY, 180, 12, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('TOTAL:', 120, finalY + 8);
    doc.text('$' + sale.total.toFixed(2), 195, finalY + 8, { align: 'right' });

    let paymentY = finalY + 18;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Pago:', 15, paymentY);

    paymentY += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (sale.paymentStatus === 'paid') {
        doc.setFillColor(34, 197, 94);
        doc.rect(15, paymentY - 4, 80, 10, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.text('PAGADO COMPLETO', 20, paymentY + 2);
        doc.setTextColor(60);
        doc.setFont('helvetica', 'normal');
        paymentY += 8;
        doc.text('Método: ' + sale.payment.methodName, 15, paymentY);
        doc.text('Pagado: $' + sale.amountPaid.toFixed(2), 15, paymentY + 5);
    } else {
        const isDeliveryPayment = sale.amountPaid === 0 && sale.balance === sale.total;
        if (isDeliveryPayment) {
            doc.setFillColor(220, 38, 38);
            doc.rect(15, paymentY - 4, 100, 10, 'F');
            doc.setTextColor(255);
            doc.setFont('helvetica', 'bold');
            doc.text('PAGO CONTRA ENTREGA', 20, paymentY + 2);
            doc.setTextColor(60);
            doc.setFont('helvetica', 'normal');
            paymentY += 8;
            doc.text('A cobrar al entregar: $' + sale.balance.toFixed(2), 15, paymentY);
            doc.text('Método: ' + sale.payment.methodName, 15, paymentY + 5);
        } else {
            doc.setFillColor(249, 115, 22);
            doc.rect(15, paymentY - 4, 80, 10, 'F');
            doc.setTextColor(255);
            doc.setFont('helvetica', 'bold');
            doc.text('PAGO PENDIENTE', 20, paymentY + 2);
            doc.setTextColor(60);
            doc.setFont('helvetica', 'normal');
            paymentY += 8;
            if (sale.amountPaid > 0) {
                doc.text('Pagado: $' + sale.amountPaid.toFixed(2), 15, paymentY);
                paymentY += 5;
            }
            doc.text('Saldo pendiente: $' + sale.balance.toFixed(2), 15, paymentY);
        }
    }

    if (sale.notes) {
        paymentY += 8;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Notas: ' + sale.notes, 15, paymentY);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text(COMPANY_INFO.pdfFooter, 105, 277, { align: 'center' });

    savePdfExplicitly(doc, 'Recibo-' + sale.saleNumber);
};


export const generateDeliveryNotePDF = async (note: DeliveryNote) => {
    const doc = new jsPDF();
    const logoDataUrl = await getLogoLight();
    const qrDataUrl = await QRCode.toDataURL('SHOP-PLUMAS-' + note.noteNumber);

    if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'JPEG', 15, 8, 25, 25);
    }

    doc.setFontSize(28);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITO', 70, 20);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento no válido como factura', 70, 25);

    doc.addImage(qrDataUrl, 'PNG', 165, 10, 25, 25);
    doc.setFontSize(7);
    doc.text('ID: ' + note.id.substring(0, 8), 168, 36);

    const dateStr = format(new Date(note.date), "dd/MM/yyyy", { locale: es });

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text('Orden de salida:', 15, 48);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(String(note.noteNumber), 50, 48);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 130, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, 150, 48);

    doc.line(15, 55, 195, 55);

    const yDest = 63;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('DESTINO (Receptor)', 15, yDest);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text('Nombre: ' + note.customerName, 15, yDest + 7);
    doc.text('Dirección: ' + note.customerAddress, 15, yDest + 13);
    if (note.customerCity || note.customerProvince) {
        const loc = 'Localidad: ' + (note.customerCity || '-') + ' - Provincia: ' + (note.customerProvince || '-');
        doc.text(loc, 15, yDest + 19);
    }

    const xOrig = 110;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('ORIGEN (Remitente)', xOrig, yDest);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(COMPANY_INFO.name, xOrig, yDest + 7);
    doc.text(COMPANY_INFO.address, xOrig, yDest + 13);
    doc.text(COMPANY_INFO.city + ', ' + COMPANY_INFO.province, xOrig, yDest + 19);
    doc.text('Tel: ' + COMPANY_INFO.phone, xOrig, yDest + 25);

    doc.setDrawColor(0);
    doc.line(15, yDest + 33, 195, yDest + 33);

    const tableData = note.items.map((item, idx) => [
        (idx + 1).toString(),
        item.productId.substring(0, 10).toUpperCase(),
        item.productName,
        item.quantity.toString(),
        '___'
    ]);

    autoTable(doc, {
        startY: yDest + 40,
        head: [['#', 'Código', 'Descripción', 'Cant.', 'Check']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 10, lineColor: 0, lineWidth: 0.3 },
        styles: { fontSize: 10, cellPadding: 4, lineColor: 150, lineWidth: 0.2 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 28 },
            2: { cellWidth: 95 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 20 }
        }
    });

    const ySign = (doc as any).lastAutoTable.finalY + 15;
    const finalYSign = ySign > 230 ? 25 : ySign;
    if (ySign > 230) doc.addPage();

    doc.setFillColor(250, 250, 250);
    doc.rect(15, finalYSign, 180, 50, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, finalYSign, 180, 50);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('CONSTANCIA DE ENTREGA', 105, finalYSign + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Declaro recibir conforme los productos detallados en este remito.', 105, finalYSign + 13, { align: 'center' });
    doc.setDrawColor(200);
    doc.line(15, finalYSign + 16, 195, finalYSign + 16);

    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('Nombre y Apellido (Claro): ____________________________________________', 20, finalYSign + 25);
    doc.text('DNI: _______________________', 20, finalYSign + 35);
    doc.text('Firma:', 20, finalYSign + 45);
    doc.line(40, finalYSign + 45, 100, finalYSign + 45);

    if (note.notes) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Observaciones: ' + note.notes, 110, finalYSign + 45);
    }

    savePdfExplicitly(doc, 'Remito-' + note.noteNumber);
};

export const generateMonthlyReportPDF = (
    month: Date,
    sales: Sale[],
    totalSales: number,
    totalProfit: number,
    topProducts: { product: Product; quantity: number; revenue: number }[]
) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(COMPANY_INFO.name, 15, 20);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('REPORTE MENSUAL', 15, 30);
    doc.setFontSize(12);
    doc.text(format(month, "MMMM yyyy", { locale: es }).toUpperCase(), 15, 38);
    doc.setFontSize(11);
    doc.text('Total de ventas: ' + sales.length, 15, 50);
    doc.text('Ingresos totales: $' + totalSales.toFixed(2), 15, 57);
    doc.text('Ganancia total: $' + totalProfit.toFixed(2), 15, 64);

    if (topProducts.length > 0) {
        doc.setFontSize(12);
        doc.text('PRODUCTOS MÁS VENDIDOS', 15, 77);
        const tableData = topProducts.map((item, index) => [
            String(index + 1),
            item.product.name,
            item.quantity.toString(),
            '$' + item.revenue.toFixed(2),
        ]);
        autoTable(doc, {
            startY: 82,
            head: [['#', 'Producto', 'Cantidad Vendida', 'Ingresos']],
            body: tableData,
        });
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(COMPANY_INFO.pdfFooter, 15, pageHeight - 10);

    savePdfExplicitly(doc, 'Reporte-' + format(month, "yyyy-MM", { locale: es }));
};
