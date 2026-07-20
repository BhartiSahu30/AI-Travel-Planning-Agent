import { jsPDF } from 'jspdf';
import type { TripPlan } from '../types';
import { formatCurrency, formatDate } from './utils';

export function generateTripPdf(plan: TripPlan, meta: { destination: string; startDate?: string; endDate?: string; currency: string }): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TravelGenie AI Itinerary', margin, 35);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${meta.destination}${meta.startDate ? `  ·  ${formatDate(meta.startDate)} - ${formatDate(meta.endDate ?? meta.startDate)}` : ''}`, margin, 55);

  y = 90;
  doc.setTextColor(30, 41, 59);

  // Summary
  if (plan.summary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Trip Summary', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(plan.summary, pageW - margin * 2);
    ensureSpace(lines.length * 13);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 16;
  }

  // Budget
  if (plan.budget) {
    ensureSpace(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Budget', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total: ${formatCurrency(plan.budget.total, plan.budget.currency ?? meta.currency)}`, margin, y);
    y += 16;
    for (const item of plan.budget.breakdown ?? []) {
      ensureSpace(14);
      doc.text(`  ${item.category}: ${formatCurrency(item.amount, plan.budget.currency ?? meta.currency)}`, margin, y);
      y += 14;
    }
    y += 12;
  }

  // Weather
  if (plan.weather && plan.weather.length > 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Weather Forecast', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const w of plan.weather) {
      ensureSpace(14);
      doc.text(`${formatDate(w.date)}: ${w.condition}, ${w.high}°C / ${w.low}°C, Humidity ${w.humidity}%, Rain ${w.rain_probability}%`, margin, y);
      y += 14;
    }
    y += 12;
  }

  // Itinerary
  if (plan.itinerary && plan.itinerary.length > 0) {
    for (const day of plan.itinerary) {
      ensureSpace(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Day ${day.day} — ${day.title} (${formatDate(day.date)})`, margin, y);
      y += 16;
      if (day.summary) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const sl = doc.splitTextToSize(day.summary, pageW - margin * 2);
        ensureSpace(sl.length * 12);
        doc.text(sl, margin, y);
        y += sl.length * 12 + 6;
      }
      for (const act of day.activities ?? []) {
        ensureSpace(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${act.time}  ${act.title}`, margin, y);
        y += 13;
        if (act.description) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const dl = doc.splitTextToSize(act.description, pageW - margin * 2);
          ensureSpace(dl.length * 11);
          doc.text(dl, margin, y);
          y += dl.length * 11;
        }
        if (act.location) {
          ensureSpace(12);
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Location: ${act.location}`, margin, y);
          y += 12;
          doc.setTextColor(30, 41, 59);
        }
        y += 4;
      }
      y += 10;
    }
  }

  // Packing list
  if (plan.packing && plan.packing.length > 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Packing Checklist', margin, y);
    y += 18;
    for (const cat of plan.packing) {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(cat.category, margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(cat.items.join(', '), margin, y);
      y += 16;
    }
  }

  // Tips
  if (plan.tips && plan.tips.length > 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Travel Tips', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const tip of plan.tips) {
      const tl = doc.splitTextToSize(`• ${tip}`, pageW - margin * 2);
      ensureSpace(tl.length * 13);
      doc.text(tl, margin, y);
      y += tl.length * 13 + 4;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by TravelGenie AI', margin, pageH - 20);
    doc.text(`${i} / ${pageCount}`, pageW - margin - 20, pageH - 20);
  }

  doc.save(`TravelGenie-${meta.destination}-${meta.startDate ?? 'trip'}.pdf`);
}
