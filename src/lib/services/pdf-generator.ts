import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

interface WeighmentSlipData {
    weighment: {
        id: string;
        weighmentNumber: string;
        firstWeight: number | null;
        secondWeight: number | null;
        netWeight: number | null;
        firstWeighmentAt: Date | null;
        secondWeighmentAt: Date | null;
        status: string;
        paymentStatus: string;
        paymentAmount: number | null;
        paymentMethod: string | null;
        paymentReference: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
        notes: string | null;
    };
    permit: {
        permitNumber: string;
        wasteType: string;
        estimatedWeight: number | null;
        driverName: string | null;
        driverPhone: string | null;
        vehicleNumber: string | null;
        vehicleType: string | null;
        pickupAddress: string;
        pickupCity: string;
        pickupState: string;
        pickupPincode: string;
    };
    plant: {
        name: string;
        code: string;
        address: string;
        city: string;
    };
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
    company: {
        name: string;
        address: string | null;
        contactEmail: string | null;
        gstNumber: string | null;
    } | null;
    approvedBy: {
        name: string;
    } | null;
}

function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatWeight(weight: number | null): string {
    if (weight === null) return '-';
    return `${weight.toFixed(2)} kg`;
}

function formatCurrency(amount: number | null): string {
    if (amount === null) return '-';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Generates a PDF weighment slip and saves it to storage
 * @param weighmentId - The ID of the weighment to generate PDF for
 * @returns The file URL of the generated PDF
 */
export async function generateWeighmentSlip(weighmentId: string): Promise<string> {
    // Fetch complete weighment data with all relations
    const weighment = await prisma.weighment.findUnique({
        where: { id: weighmentId },
        include: {
            permit: {
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    company: {
                        select: {
                            name: true,
                            address: true,
                            contactEmail: true,
                            gstNumber: true
                        }
                    },
                },
            },
            plant: {
                select: {
                    name: true,
                    code: true,
                    address: true,
                    city: true
                }
            },
            approvedBy: { select: { name: true } },
        },
    });

    if (!weighment || !weighment.permit) {
        throw new Error('Weighment or associated permit not found');
    }

    const data: WeighmentSlipData = {
        weighment: {
            id: weighment.id,
            weighmentNumber: weighment.weighmentNumber,
            firstWeight: weighment.firstWeight,
            secondWeight: weighment.secondWeight,
            netWeight: weighment.netWeight,
            firstWeighmentAt: weighment.firstWeighmentAt,
            secondWeighmentAt: weighment.secondWeighmentAt,
            status: weighment.status,
            paymentStatus: weighment.paymentStatus,
            paymentAmount: weighment.paymentAmount,
            paymentMethod: weighment.paymentMethod,
            paymentReference: weighment.paymentReference,
            approvedAt: weighment.approvedAt,
            rejectionReason: weighment.rejectionReason,
            notes: weighment.notes,
        },
        permit: {
            permitNumber: weighment.permit.permitNumber,
            wasteType: weighment.permit.wasteType,
            estimatedWeight: weighment.permit.estimatedWeight,
            driverName: weighment.permit.driverName,
            driverPhone: weighment.permit.driverPhone,
            vehicleNumber: weighment.permit.vehicleNumber,
            vehicleType: weighment.permit.vehicleType,
            pickupAddress: weighment.permit.pickupAddress,
            pickupCity: weighment.permit.pickupCity,
            pickupState: weighment.permit.pickupState,
            pickupPincode: weighment.permit.pickupPincode,
        },
        plant: weighment.plant,
        user: weighment.permit.user,
        company: weighment.permit.company,
        approvedBy: weighment.approvedBy,
    };

    // Generate PDF
    const doc = new jsPDF();
    let yPos = 20;
    const leftMargin = 20;
    const rightCol = 110;
    const pageWidth = 190;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('WEIGHMENT SLIP', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Municipal Corporation of Gurugram', 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text('C&D Waste Management System', 105, yPos, { align: 'center' });
    yPos += 10;

    // Divider line
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, leftMargin + pageWidth, yPos);
    yPos += 10;

    // Weighment Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Weighment Details', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const addRow = (label: string, value: string, x: number = leftMargin) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', x, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + 35, yPos);
    };

    addRow('Weighment No', data.weighment.weighmentNumber);
    addRow('Permit No', data.permit.permitNumber, rightCol);
    yPos += 6;

    addRow('Status', data.weighment.status);
    addRow('Date', formatDate(data.weighment.approvedAt || new Date()), rightCol);
    yPos += 6;

    addRow('Plant', `${data.plant.name} (${data.plant.code})`);
    yPos += 10;

    // Weight Measurements Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Weight Measurements', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    addRow('First Weight', formatWeight(data.weighment.firstWeight));
    addRow('Time', formatDate(data.weighment.firstWeighmentAt), rightCol);
    yPos += 6;

    addRow('Second Weight', formatWeight(data.weighment.secondWeight));
    addRow('Time', formatDate(data.weighment.secondWeighmentAt), rightCol);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    addRow('Net Weight', formatWeight(data.weighment.netWeight));
    doc.setFont('helvetica', 'normal');
    yPos += 10;

    // Waste & Vehicle Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Waste & Vehicle Details', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const wasteTypeLabel = data.permit.wasteType === 'CND_SEGREGATED' ? 'C&D Segregated' : 'C&D Unsegregated';
    addRow('Waste Type', wasteTypeLabel);
    addRow('Est. Weight', formatWeight(data.permit.estimatedWeight), rightCol);
    yPos += 6;

    addRow('Vehicle No', data.permit.vehicleNumber || '-');
    addRow('Vehicle Type', data.permit.vehicleType || '-', rightCol);
    yPos += 6;

    addRow('Driver Name', data.permit.driverName || '-');
    addRow('Driver Phone', data.permit.driverPhone || '-', rightCol);
    yPos += 10;

    // Source Location Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Source Location', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const sourceAddress = `${data.permit.pickupAddress}, ${data.permit.pickupCity}, ${data.permit.pickupState} - ${data.permit.pickupPincode}`;
    const addressLines = doc.splitTextToSize(sourceAddress, pageWidth);
    doc.text(addressLines, leftMargin, yPos);
    yPos += addressLines.length * 5 + 5;

    // User/Company Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Applicant Details', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    addRow('Name', data.user.name);
    addRow('Email', data.user.email, rightCol);
    yPos += 6;

    if (data.user.phone) {
        addRow('Phone', data.user.phone);
        yPos += 6;
    }

    if (data.company) {
        addRow('Company', data.company.name);
        yPos += 6;
        if (data.company.gstNumber) {
            addRow('GST No', data.company.gstNumber);
            yPos += 6;
        }
    }
    yPos += 4;

    // Payment Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', leftMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    addRow('Status', data.weighment.paymentStatus);
    addRow('Amount', formatCurrency(data.weighment.paymentAmount), rightCol);
    yPos += 6;

    if (data.weighment.paymentMethod) {
        addRow('Method', data.weighment.paymentMethod);
    }
    if (data.weighment.paymentReference) {
        addRow('Reference', data.weighment.paymentReference, rightCol);
    }
    yPos += 10;

    // Notes Section (if any)
    if (data.weighment.notes) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes', leftMargin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(data.weighment.notes, pageWidth);
        doc.text(notesLines, leftMargin, yPos);
        yPos += notesLines.length * 5 + 5;
    }

    // Divider line before footer
    yPos = Math.max(yPos, 250);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, yPos, leftMargin + pageWidth, yPos);
    yPos += 8;

    // Footer
    doc.setFontSize(9);
    if (data.approvedBy) {
        doc.text(`Approved by: ${data.approvedBy.name}`, leftMargin, yPos);
        doc.text(`Date: ${formatDate(data.weighment.approvedAt)}`, rightCol, yPos);
    }
    yPos += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated document and does not require a signature.', 105, yPos, { align: 'center' });

    // Save PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Save to storage
    const fileName = `weighments/${data.weighment.weighmentNumber}.pdf`;
    const uploadsDir = process.env.STORAGE_LOCAL_PATH 
    ? path.join(process.env.STORAGE_LOCAL_PATH, 'public', 'weighments')
    : path.join(process.cwd(), 'uploads', 'public', 'weighments');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${data.weighment.weighmentNumber}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    // Return the public URL
    const fileUrl = `/uploads/public/weighments/${data.weighment.weighmentNumber}.pdf`

    return fileUrl;
}
