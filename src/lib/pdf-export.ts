import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Colors ───────────────────────────────────────────────────────────────────
const GREEN  = [22, 163, 74]   as [number, number, number]
const DARK   = [10, 15, 13]    as [number, number, number]
const BLACK  = [0, 0, 0]       as [number, number, number]
const LGRAY  = [229, 231, 235] as [number, number, number]
const WHITE  = [255, 255, 255] as [number, number, number]
const YELLOW = [217, 119, 6]   as [number, number, number]
const RED    = [220, 38, 38]   as [number, number, number]
const BLUE   = [37, 99, 235]   as [number, number, number]

// ── Load logo as base64 PNG via canvas ───────────────────────────────────────
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/lrct.svg')
    const svgText = await res.text()
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    return await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 120
        canvas.height = 120
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 120, 120)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      img.src = url
    })
  } catch {
    return null
  }
}

// ── Header ───────────────────────────────────────────────────────────────────
function addHeader(
  doc: jsPDF,
  title: string,
  logoBase64: string | null
) {
  const W = doc.internal.pageSize.getWidth()
  const HEADER_H = 30

  // Logo — left corner
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 8, 3, 24, 24)
  }

  // Club name — black, horizontally centered
  doc.setTextColor(...BLACK)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('LANDROVER CLUB TANZANIA', W / 2, 13, { align: 'center' })

  // Website & email — green, centered
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREEN)
  doc.text('www.landroverclub.or.tz  ·  info@landroverclub.or.tz', W / 2, 21, { align: 'center' })

  // Generated date — top right, gray
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(6.5)
  const dateStr = new Date().toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  doc.text(`Generated: ${dateStr}`, W - 8, 8, { align: 'right' })

  // Green accent stripe
  doc.setFillColor(...GREEN)
  doc.rect(0, HEADER_H, W, 2, 'F')

  // Light title band
  doc.setFillColor(248, 249, 250)
  doc.rect(0, HEADER_H + 2, W, 16, 'F')

  // Report title — centered
  doc.setTextColor(...DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, W / 2, HEADER_H + 13, { align: 'center' })

  // Bottom separator
  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.3)
  doc.line(14, HEADER_H + 18, W - 14, HEADER_H + 18)
}

// ── Footer ────────────────────────────────────────────────────────────────────
function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...DARK)
    doc.rect(0, H - 10, W, 10, 'F')
    doc.setFillColor(...GREEN)
    doc.rect(0, H - 10, 3, 10, 'F')
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Land Rover Club Tanzania — Confidential Document', 8, H - 4)
    doc.text(`Page ${i} of ${pageCount}`, W - 10, H - 4, { align: 'right' })
  }
}

// ── Status pill coloring inside table cell ───────────────────────────────────
const STATUS_COLORS: Record<string, [number, number, number]> = {
  pending:    YELLOW,
  approved:   GREEN,
  confirmed:  GREEN,
  rejected:   RED,
  cancelled:  RED,
  waitlisted: BLUE,
}

function colorStatusCell(data: any, doc: jsPDF, colIndex: number) {
  if (data.column.index !== colIndex || data.section !== 'body') return
  const raw = String(data.cell.raw)
  const color = STATUS_COLORS[raw.toLowerCase()]
  if (!color) return
  const { x, y, width, height } = data.cell
  const pad = 3
  doc.setFillColor(
    Math.min(255, color[0] + 195),
    Math.min(255, color[1] + 195),
    Math.min(255, color[2] + 195)
  )
  doc.roundedRect(x + pad, y + 1.8, width - pad * 2, height - 3.6, 1.5, 1.5, 'F')
  doc.setTextColor(...color)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(raw, x + width / 2, y + height / 2 + 1, { align: 'center' })
}

// ── MEMBERSHIP APPLICATIONS EXPORT ───────────────────────────────────────────
export async function exportMembershipApplicationsPDF(
  applications: any[],
  filter: string = 'all'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoBase64 = await loadLogoBase64()

  addHeader(doc, 'Membership Applications', logoBase64)

  autoTable(doc, {
    startY: 52,
    head: [['#', 'Full Name', 'Email', 'Phone', 'Vehicle', 'Guarantor', 'Gender', 'Submitted', 'Status']],
    body: applications.map((a, i) => [
      i + 1,
      a.full_name || '—',
      a.email || '—',
      a.phone || '—',
      [a.vehicle_year, a.vehicle_make, a.vehicle_model].filter(Boolean).join(' ') || '—',
      a.guarantor?.full_name || '—',
      a.gender || '—',
      a.created_at
        ? new Date(a.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
      (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1) || '—',
    ]),
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 50 },
      3: { cellWidth: 27 },
      4: { cellWidth: 34 },
      5: { cellWidth: 30 },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 24 },
      8: { cellWidth: 27, halign: 'center' },
    },
    didDrawCell: (data) => colorStatusCell(data, doc, 8),
    tableLineColor: LGRAY,
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14, bottom: 14 },
  })

  addFooter(doc)
  doc.save(`LRCT-Membership-${filter}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── EVENT REGISTRATIONS EXPORT ────────────────────────────────────────────────
export async function exportEventRegistrationsPDF(
  registrations: any[],
  eventFilter: string = 'All',
  statusFilter: string = 'All'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logoBase64 = await loadLogoBase64()

  addHeader(doc, 'Event Registrations', logoBase64)

  autoTable(doc, {
    startY: 52,
    head: [['#', 'Full Name', 'Email', 'Phone', 'Event', 'Event Date', 'Message', 'Registered', 'Status']],
    body: registrations.map((r, i) => [
      i + 1,
      r.full_name || '—',
      r.email || '—',
      r.phone || '—',
      r.event_title || '—',
      r.event_date
        ? new Date(r.event_date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
      r.message || '—',
      r.registered_at
        ? new Date(r.registered_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
      (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1) || '—',
    ]),
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 34 },
      2: { cellWidth: 46 },
      3: { cellWidth: 26 },
      4: { cellWidth: 44 },
      5: { cellWidth: 22 },
      6: { cellWidth: 38 },
      7: { cellWidth: 22 },
      8: { cellWidth: 26, halign: 'center' },
    },
    didDrawCell: (data) => colorStatusCell(data, doc, 8),
    tableLineColor: LGRAY,
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14, bottom: 14 },
  })

  addFooter(doc)
  const safeName = eventFilter !== 'All'
    ? `-${eventFilter.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}`
    : ''
  doc.save(`LRCT-Registrations${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}