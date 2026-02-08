import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAgreementPDF = (agreement: any, companyProfile: any) => {
    const doc = new jsPDF();

    // -- HEADER --
    // Company Name (Large, Centered)
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(companyProfile?.companyName || "TRAVEL AGENCY", 105, 20, { align: "center" });

    // Company Details (Smaller, Centered)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const address = companyProfile?.companyAddress ? companyProfile.companyAddress.replace(/\n/g, ", ") : "";
    const phone = companyProfile?.companyPhone || "";
    doc.text(`${address} | ${phone}`, 105, 28, { align: "center" });

    // Line Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 35, 200, 35);

    // Document Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("TOUR BOOKING AGREEMENT", 105, 48, { align: "center" });

    // Booking Ref
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Booking Ref: #${agreement.id.slice(0, 8).toUpperCase()}`, 105, 54, { align: "center" });

    let finalY = 60;

    // -- SECTION 1: CUSTOMER & TRIP DETAILS --
    autoTable(doc, {
        startY: finalY,
        head: [['Customer Details', 'Trip Details']],
        body: [
            [
                `Name: ${agreement.customerName}\nPhone: ${agreement.phone || '-'}`,
                `From: ${agreement.fromDate}\nTo: ${agreement.toDate}\nRoute: ${agreement.placesToCover}`
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { cellPadding: 5, fontSize: 10 }
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10;

    // -- SECTION 2: BUS & RENT DETAILS --
    const busRows = [
        ['Bus Type', agreement.busType],
        ['Count', agreement.busCount?.toString() || '1'],
    ]; // Add vehicle numbers if assigned

    const rentRows = [
        ['Per Day Rent', `Rs. ${agreement.perDayRent?.toLocaleString() || '-'}`],
        ['Total Days', calculateDays(agreement.fromDate, agreement.toDate).toString()],
        ['Total Rent', `Rs. ${agreement.totalAmount?.toLocaleString()}`]
    ];

    doc.text("Rent Details", 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Description', 'Amount / Details']],
        body: [
            ...busRows,
            ...rentRows
        ],
        theme: 'striped',
        headStyles: { fillColor: [60, 60, 60] }
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10;

    // -- SECTION 3: PAYMENT SUMMARY --
    doc.text("Payment Summary", 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Description', 'Amount (Rs.)']],
        body: [
            ['Total Amount', agreement.totalAmount?.toLocaleString()],
            ['Advance Paid', agreement.advancePaid?.toLocaleString()],
            ['Balance Due', agreement.balance?.toLocaleString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] }, // Green
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 20;

    // -- FOOTER / SIGNATURES --
    if (finalY > 250) {
        doc.addPage();
        finalY = 40;
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text("For Customer:", 20, finalY);
    doc.text("For Travels:", 140, finalY);

    doc.line(20, finalY + 25, 80, finalY + 25); // Sig line
    doc.line(140, finalY + 25, 190, finalY + 25); // Sig line

    doc.text("(Signature)", 35, finalY + 30);
    doc.text("(Authorized Signatory)", 145, finalY + 30);

    // Save
    doc.save(`Booking_${agreement.customerName}_${agreement.fromDate}.pdf`);
};

function calculateDays(from: string, to: string) {
    if (!from || !to) return 0;
    // Assumes dd/MM/yyyy
    const parse = (d: string) => {
        const p = d.split('/');
        return new Date(+p[2], +p[1] - 1, +p[0]);
    };
    const diff = parse(to).getTime() - parse(from).getTime();
    return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
}
