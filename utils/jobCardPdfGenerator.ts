import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TechnicianTaskLog } from '../components/inventory/TechnicianTasksTab';

export const generateSingleJobCardPDF = (task: TechnicianTaskLog, companyName: string = 'STARTECH COMMUNICATION LTD') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Refined Executive Palette - Clean, Light & High Contrast (No Dark Top)
  const textDark: [number, number, number] = [15, 23, 42]; // Slate 900
  const textBody: [number, number, number] = [51, 65, 85]; // Slate 700
  const textMuted: [number, number, number] = [100, 116, 139]; // Slate 500
  const borderLight: [number, number, number] = [226, 232, 240]; // Slate 200
  const bgCard: [number, number, number] = [248, 250, 252]; // Slate 50
  const tableHeaderBg: [number, number, number] = [241, 245, 249]; // Slate 100

  const isCompleted = task.status === 'Completed' || (task.status as string) === 'Closed' || (task.status as string) === 'Complete';

  // 1. Clean Executive Header (Pure White Background - No Dark Top)
  let currentY = 14;

  // Company Name
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(companyName.toUpperCase(), margin, currentY + 3);

  // Subtitle & Document Classification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 116, 144); // Slate / Tech Cyan accent
  doc.text('OFFICIAL JOB CARD & TECHNICAL WORK ORDER', margin, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • STARTECH WORKSHOP HUB`, margin, currentY + 12.5);

  // Header Right: Status & Job Card Ref Pill
  const rightBoxWidth = 56;
  const rightBoxHeight = 13.5;
  const rightBoxX = pageWidth - margin - rightBoxWidth;
  const rightBoxY = currentY - 2;

  // Status background & border
  if (isCompleted) {
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(16, 185, 129); // Emerald 500
    doc.roundedRect(rightBoxX, rightBoxY, rightBoxWidth, rightBoxHeight, 2, 2, 'FD');

    doc.setTextColor(6, 95, 70); // Emerald 800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('STATUS: COMPLETED & CLOSED', rightBoxX + (rightBoxWidth / 2), rightBoxY + 5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(task.jobCardNumber || 'JC-RECORD', rightBoxX + (rightBoxWidth / 2), rightBoxY + 10.5, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199); // Amber 50
    doc.setDrawColor(217, 119, 6); // Amber 600
    doc.roundedRect(rightBoxX, rightBoxY, rightBoxWidth, rightBoxHeight, 2, 2, 'FD');

    doc.setTextColor(146, 64, 14); // Amber 800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`STATUS: ${(task.status || 'IN PROGRESS').toUpperCase()}`, rightBoxX + (rightBoxWidth / 2), rightBoxY + 5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(task.jobCardNumber || 'JC-RECORD', rightBoxX + (rightBoxWidth / 2), rightBoxY + 10.5, { align: 'center' });
  }

  // Divider Line
  currentY += 18;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;

  // 2. Core Metadata Grid (Job Card Details)
  const cardHeight = 18;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, currentY, pageWidth - (margin * 2), cardHeight, 1.5, 1.5, 'FD');

  const colWidth = (pageWidth - (margin * 2)) / 4;

  // Col 1: Job Card
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('JOB CARD NUMBER', margin + 4, currentY + 5.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);
  doc.text(task.jobCardNumber || 'JC-RECORD', margin + 4, currentY + 12);

  // Col 2: Date
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RECORD DATE', margin + colWidth + 4, currentY + 5.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(8.5);
  doc.text(task.date || 'Standard Record', margin + colWidth + 4, currentY + 12);

  // Col 3: Category
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DISCIPLINE / CATEGORY', margin + (colWidth * 2) + 4, currentY + 5.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(8.5);
  doc.text(task.category || 'General Operations', margin + (colWidth * 2) + 4, currentY + 12);

  // Col 4: Equipment Reference
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('EQUIPMENT / LOCATION / AREA', margin + (colWidth * 3) + 4, currentY + 5.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(8.5);
  const equipText = task.equipmentRef && task.equipmentRef !== 'N/A' ? task.equipmentRef : 'Facility / Workshop';
  doc.text(doc.splitTextToSize(equipText, colWidth - 8)[0], margin + (colWidth * 3) + 4, currentY + 12);

  currentY += cardHeight + 6;

  // 3. Technical Personnel & Team Assignment
  const teamMemberNames = task.teamMembers && task.teamMembers.length > 0 
    ? task.teamMembers.map(m => m.name).join(', ') 
    : 'None (Sole Assigned)';

  const attendanceInfo = task.attendanceRegister 
    ? `Register Verified (${task.attendanceRegister.startTime} - ${task.attendanceRegister.endTime})` 
    : 'Standard Log';

  const assignmentBody = [
    [
      { content: 'Lead Technician:', styles: { fontStyle: 'bold' as const, fillColor: bgCard } },
      `${task.technicianName}`,
      { content: 'Assisting Team:', styles: { fontStyle: 'bold' as const, fillColor: bgCard } },
      teamMemberNames
    ],
    [
      { content: 'Work Status:', styles: { fontStyle: 'bold' as const, fillColor: bgCard } },
      isCompleted ? 'Completed & Closed' : (task.status || 'In Progress'),
      { content: 'Attendance Shift:', styles: { fontStyle: 'bold' as const, fillColor: bgCard } },
      attendanceInfo
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: assignmentBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: textBody,
      lineColor: borderLight,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 56 },
      2: { cellWidth: 36 },
      3: { cellWidth: 'auto' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Work Description & Detailed Scope of Work
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('WORK DESCRIPTION & TECHNICAL ACTION', margin, currentY);

  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Technical Notes & Maintenance Actions Performed']],
    body: [[task.description || 'No detailed work description recorded.']],
    theme: 'grid',
    headStyles: {
      fillColor: tableHeaderBg,
      textColor: textDark,
      fontSize: 7.5,
      fontStyle: 'bold',
      lineColor: borderLight,
      lineWidth: 0.2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: textDark,
      lineColor: borderLight,
      lineWidth: 0.2
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. Materials & Spares Utilization
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SPARES & MATERIALS UTILIZATION', margin, currentY);

  currentY += 2;

  const sparesBody = task.sparesUsed 
    ? [[task.sparesUsed]] 
    : [['No replacement spares or billable parts recorded for this job card.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Item Description / Part Reference & Quantity']],
    body: sparesBody,
    theme: 'grid',
    headStyles: {
      fillColor: tableHeaderBg,
      textColor: textDark,
      fontSize: 7.5,
      fontStyle: 'bold',
      lineColor: borderLight,
      lineWidth: 0.2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: task.sparesUsed ? textDark : textMuted,
      fontStyle: task.sparesUsed ? 'normal' : 'italic',
      lineColor: borderLight,
      lineWidth: 0.2
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Linked Attendance Register (if available)
  if (task.attendanceRegister && task.attendanceRegister.entries && task.attendanceRegister.entries.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 15;
    }

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ATTENDANCE REGISTER LOG', margin, currentY);

    currentY += 2;

    const attHead = [['Personnel Name', 'Shift', 'Timesheet Window', 'Register Status']];
    const attBody = task.attendanceRegister.entries.map(e => [
      e.employeeName,
      e.shift || task.attendanceRegister?.shift || 'General',
      `${e.startTime || task.attendanceRegister?.startTime} - ${e.endTime || task.attendanceRegister?.endTime}`,
      e.status || 'Verified'
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: attHead,
      body: attBody,
      theme: 'grid',
      headStyles: {
        fillColor: tableHeaderBg,
        textColor: textDark,
        fontSize: 7.5,
        fontStyle: 'bold',
        lineColor: borderLight,
        lineWidth: 0.2
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: textDark,
        lineColor: borderLight,
        lineWidth: 0.2
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Check page overflow before signatures
  if (currentY > pageHeight - 42) {
    doc.addPage();
    currentY = 15;
  }

  // 7. Authorization & Verification Signatures
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AUTHORIZATION & VERIFICATION', margin, currentY);

  currentY += 3;

  const boxWidth = (pageWidth - (margin * 2) - 6) / 2;
  const boxHeight = 26;

  // Box 1: Lead Technician
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('LEAD TECHNICIAN CONFIRMATION', margin + 4, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Technician: ${task.technicianName}`, margin + 4, currentY + 10);
  doc.text(`Date: ${task.date || 'Standard Record'}`, margin + 4, currentY + 14.5);
  doc.text('Signature: _________________________', margin + 4, currentY + 21.5);

  // Box 2: Supervisor / Workshop Management
  const box2X = margin + boxWidth + 6;
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SUPERVISOR APPROVAL', box2X + 4, currentY + 5);

  const signoffStatus = task.supervisorSignoff || (isCompleted ? 'Verified & Completed' : 'Pending Verification');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Approval: ${signoffStatus}`, box2X + 4, currentY + 10);
  doc.text(`Date: ${isCompleted ? (task.date || 'Closed') : 'Pending'}`, box2X + 4, currentY + 14.5);
  doc.text('Signature: _________________________', box2X + 4, currentY + 21.5);

  // 8. Watermark and Footers on every page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Professional 'CLOSED' / 'COMPLETED' Watermark across the document
    if (isCompleted) {
      try {
        (doc as any).saveGraphicsState();
        if ((doc as any).GState) {
          const gState = new (doc as any).GState({ opacity: 0.08 });
          (doc as any).setGState(gState);
          doc.setTextColor(16, 185, 129); // Emerald tint
        } else {
          doc.setTextColor(230, 245, 235); // Subtle light tint fallback
        }
      } catch {
        doc.setTextColor(230, 245, 235);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(50);
      doc.text('CLOSED / COMPLETED', pageWidth / 2, (pageHeight / 2) + 10, {
        align: 'center',
        angle: 35
      });

      // Subtle decorative stamp border around the watermark text
      try {
        (doc as any).restoreGraphicsState();
      } catch {}
    }

    // Clean Footer
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Job Card: ${task.jobCardNumber} • STARTECH HUB • Confidential Technical Work Order`, margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  // Trigger download
  const cleanJc = (task.jobCardNumber || 'JobCard').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `JobCard_${cleanJc}_${task.date || 'Record'}.pdf`;
  doc.save(filename);
};

