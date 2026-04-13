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

// ── Load any image URL as base64 via canvas ───────────────────────────────────
async function loadImageBase64(url: string): Promise<string | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 1200 / img.naturalWidth)
        canvas.width  = img.naturalWidth  * scale
        canvas.height = img.naturalHeight * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  } catch {
    return null
  }
}

// ── Header ───────────────────────────────────────────────────────────────────
function addHeader(doc: jsPDF, title: string, logoBase64: string | null) {
  const W = doc.internal.pageSize.getWidth()
  const HEADER_H = 30

  if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 3, 24, 24)

  doc.setTextColor(...BLACK)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('LAND ROVER CLUB TANZANIA', W / 2, 13, { align: 'center' })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREEN)
  doc.text('landroverclub.or.tz  ·  info@landroverclub.or.tz', W / 2, 21, { align: 'center' })

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(6.5)
  const dateStr = new Date().toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  doc.text(`Generated: ${dateStr}`, W - 8, 8, { align: 'right' })

  doc.setFillColor(...GREEN)
  doc.rect(0, HEADER_H, W, 2, 'F')

  doc.setFillColor(248, 249, 250)
  doc.rect(0, HEADER_H + 2, W, 16, 'F')

  doc.setTextColor(...DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, W / 2, HEADER_H + 13, { align: 'center' })

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

// ── Detail PDF helpers ────────────────────────────────────────────────────────

function sectionHeading(doc: jsPDF, label: string, y: number, W: number): number {
  doc.setFillColor(248, 249, 250)
  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.3)
  doc.roundedRect(14, y, W - 28, 8, 1, 1, 'FD')
  doc.setFillColor(...GREEN)
  doc.roundedRect(14, y, 3, 8, 1, 1, 'F')
  doc.setTextColor(...DARK)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(label.toUpperCase(), 21, y + 5.5)
  return y + 12
}

function fieldRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  W: number
): number {
  const labelX = 14
  const valueX = 70
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text(label, labelX, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(31, 41, 55)
  const lines = doc.splitTextToSize(value || '—', W - valueX - 14)
  doc.text(lines, valueX, y)
  return y + Math.max(6, lines.length * 5.5)
}

function statusBadge(doc: jsPDF, status: string, x: number, y: number) {
  const color = STATUS_COLORS[status.toLowerCase()] ?? DARK
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const tw = doc.getTextWidth(label) + 10
  doc.setFillColor(
    Math.min(255, color[0] + 195),
    Math.min(255, color[1] + 195),
    Math.min(255, color[2] + 195)
  )
  doc.roundedRect(x, y - 5, tw, 7, 1.5, 1.5, 'F')
  doc.setTextColor(...color)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(label, x + tw / 2, y, { align: 'center' })
}

async function embedImage(
  doc: jsPDF,
  base64: string,
  label: string,
  y: number,
  W: number,
  maxH = 80
): Promise<number> {
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text(label.toUpperCase(), 14, y)
  y += 4
  try {
    const props = (doc as any).getImageProperties(base64)
    const ratio = props.width / props.height
    const imgW = Math.min(W - 28, ratio * maxH)
    const imgH = imgW / ratio
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.roundedRect(14, y, imgW, imgH, 2, 2, 'D')
    doc.addImage(base64, 'JPEG', 14, y, imgW, imgH)
    return y + imgH + 8
  } catch {
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('(Image could not be embedded)', 14, y + 5)
    return y + 12
  }
}

// ── INDIVIDUAL MEMBERSHIP APPLICATION PDF ────────────────────────────────────
export async function exportMembershipApplicationDetailPDF(app: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const logoBase64 = await loadLogoBase64()

  addHeader(doc, 'Membership Application', logoBase64)

  let y = 54

  // Status badge + ID
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(`Application ID: ${app.id || '—'}`, 14, y)
  if (app.status) statusBadge(doc, app.status, W - 55, y)
  y += 10

  // Profile photo top-right
  if (app.photo_url) {
    const photoB64 = await loadImageBase64(app.photo_url)
    if (photoB64) {
      try {
        doc.setDrawColor(...LGRAY)
        doc.setLineWidth(0.4)
        doc.roundedRect(W - 46, 34, 32, 32, 2, 2, 'D')
        doc.addImage(photoB64, 'JPEG', W - 46, 34, 32, 32)
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text('Applicant Photo', W - 30, 70, { align: 'center' })
      } catch {}
    }
  }

  // ── Personal Information ──
  y = sectionHeading(doc, 'Personal Information', y, W)
  y = fieldRow(doc, 'Full Name',      app.full_name || '—',    y, W)
  y = fieldRow(doc, 'Email',          app.email || '—',        y, W)
  y = fieldRow(doc, 'Phone',          app.phone || '—',        y, W)
  y = fieldRow(doc, 'Date of Birth',  app.date_of_birth || '—', y, W)
  y = fieldRow(doc, 'Gender',         app.gender || '—',       y, W)
  y = fieldRow(doc, 'P.O. Box',       app.po_box || '—',       y, W)
  if (app.heard_about) {
    y = fieldRow(doc, 'How They Heard',
      `${app.heard_about}${app.heard_other ? ` (${app.heard_other})` : ''}`, y, W)
  }
  if (app.message || app.bio) {
    y = fieldRow(doc, 'Bio / Message', app.message || app.bio || '—', y, W)
  }
  y += 4

  // ── Vehicle Information ──
  if (app.vehicle_make || app.vehicle_model || app.vehicle_year) {
    y = sectionHeading(doc, 'Vehicle Information', y, W)
    y = fieldRow(doc, 'Make',  app.vehicle_make  || '—', y, W)
    y = fieldRow(doc, 'Model', app.vehicle_model || '—', y, W)
    y = fieldRow(doc, 'Year',  app.vehicle_year  || '—', y, W)
    y += 4
  }

  // ── Guarantor ──
  if (app.guarantor) {
    y = sectionHeading(doc, 'Guarantor / Mdhamini', y, W)
    y = fieldRow(doc, 'Name',     app.guarantor.full_name || '—', y, W)
    y = fieldRow(doc, 'Phone',    app.guarantor.phone     || '—', y, W)
    y = fieldRow(doc, 'Email',    app.guarantor.email     || '—', y, W)
    y = fieldRow(doc, 'P.O. Box', app.guarantor.po_box    || '—', y, W)
    if (app.guarantor.description) {
      y = fieldRow(doc, 'Statement', app.guarantor.description, y, W)
    }
    if (app.guarantor.signature) {
      try {
        y += 2
        doc.setDrawColor(...LGRAY)
        doc.setLineWidth(0.3)
        doc.roundedRect(14, y, 70, 22, 1, 1, 'D')
        doc.addImage(app.guarantor.signature, 'PNG', 14, y, 70, 22)
        doc.setFontSize(6)
        doc.setTextColor(150, 150, 150)
        doc.text('Guarantor Signature', 14, y + 26)
        y += 30
      } catch { y += 4 }
    }
    y += 4
  }

  // ── Application Details ──
  y = sectionHeading(doc, 'Application Details', y, W)
  y = fieldRow(doc, 'Submitted',    app.created_at ? new Date(app.created_at).toLocaleString('en-TZ') : '—', y, W)
  y = fieldRow(doc, 'Last Updated', app.updated_at ? new Date(app.updated_at).toLocaleString('en-TZ') : '—', y, W)
  y = fieldRow(doc, 'T&C Agreed',   app.tc_agreed ? 'Yes' : 'No', y, W)
  y += 4

  // ── Applicant Signature ──
  if (app.applicant_signature) {
    y = sectionHeading(doc, 'Applicant Signature', y, W)
    try {
      doc.setDrawColor(...LGRAY)
      doc.setLineWidth(0.3)
      doc.roundedRect(14, y, 80, 25, 1, 1, 'D')
      doc.addImage(app.applicant_signature, 'PNG', 14, y, 80, 25)
      y += 30
    } catch { y += 4 }
  }

  // ── Attachments page ──
  const attachments: string[] = []
  if (app.attachment_urls?.length) attachments.push(...app.attachment_urls)
  // Also pick up individual URL fields saved by the website form
  if (app.id_doc_url && !attachments.includes(app.id_doc_url))         attachments.push(app.id_doc_url)
  if (app.payment_proof_url && !attachments.includes(app.payment_proof_url)) attachments.push(app.payment_proof_url)
  const uniqueAttachments = [...new Set(attachments.filter(Boolean))]

  if (uniqueAttachments.length > 0) {
    doc.addPage()
    addHeader(doc, 'Attachments & Documents', logoBase64)
    y = 54

    for (let i = 0; i < uniqueAttachments.length; i++) {
      const url = uniqueAttachments[i]
      const isImage = /\.(jpg|jpeg|png|webp|gif)/i.test(url) ||
        (url.includes('cloudinary') && !url.includes('.pdf'))

      const label =
        url === app.photo_url          ? 'Applicant Photo'
        : url === app.id_doc_url       ? 'ID / Passport Copy'
        : url === app.payment_proof_url ? 'Payment Proof'
        : `Attachment ${i + 1}`

      if (isImage) {
        if (y > H - 80) { doc.addPage(); addHeader(doc, 'Attachments & Documents', logoBase64); y = 54 }
        const b64 = await loadImageBase64(url)
        if (b64) {
          y = await embedImage(doc, b64, label, y, W, 100)
        } else {
          doc.setFontSize(7.5)
          doc.setTextColor(150, 150, 150)
          doc.text(`${label}: (could not load)`, 14, y)
          y += 8
        }
      } else {
        if (y > H - 30) { doc.addPage(); addHeader(doc, 'Attachments & Documents', logoBase64); y = 54 }
        doc.setFillColor(248, 249, 250)
        doc.setDrawColor(...LGRAY)
        doc.setLineWidth(0.3)
        doc.roundedRect(14, y, W - 28, 16, 2, 2, 'FD')
        doc.setFillColor(...RED)
        doc.roundedRect(14, y, 4, 16, 1, 1, 'F')
        doc.setTextColor(...DARK)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(label, 22, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...BLUE)
        doc.text(url.length > 85 ? url.slice(0, 82) + '…' : url, 22, y + 12)
        y += 20
      }
    }
  }

  addFooter(doc)
  const safeName = (app.full_name || 'application').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)
  doc.save(`LRCT-Application-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── INDIVIDUAL EVENT REGISTRATION PDF ────────────────────────────────────────
export async function exportEventRegistrationDetailPDF(reg: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const logoBase64 = await loadLogoBase64()

  addHeader(doc, 'Event Registration', logoBase64)

  let y = 54

  // Status badge + ID
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(`Registration ID: ${reg.id || '—'}`, 14, y)
  if (reg.status) statusBadge(doc, reg.status, W - 55, y)
  y += 10

  // ── Event Details ──
  y = sectionHeading(doc, 'Event Details', y, W)
  y = fieldRow(doc, 'Event Title', reg.event_title || '—', y, W)
  y = fieldRow(doc, 'Event Date',
    reg.event_date ? new Date(reg.event_date).toLocaleDateString('en-TZ', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) : '—', y, W)
  y += 4

  // ── Registrant Details ──
  y = sectionHeading(doc, 'Registrant Details', y, W)
  y = fieldRow(doc, 'Full Name', reg.full_name || '—', y, W)
  y = fieldRow(doc, 'Email',     reg.email     || '—', y, W)
  y = fieldRow(doc, 'Phone',     reg.phone     || '—', y, W)
  if (reg.message) y = fieldRow(doc, 'Message', reg.message, y, W)
  y += 4

  // ── Registration Info ──
  y = sectionHeading(doc, 'Registration Info', y, W)
  y = fieldRow(doc, 'Registered At',
    reg.registered_at ? new Date(reg.registered_at).toLocaleString('en-TZ') : '—', y, W)
  y = fieldRow(doc, 'Event ID', reg.event_id || '—', y, W)
  y += 10

  // ── Status confirmation box ──
  const statusColor = STATUS_COLORS[reg.status?.toLowerCase()] ?? DARK
  doc.setFillColor(
    Math.min(255, statusColor[0] + 210),
    Math.min(255, statusColor[1] + 210),
    Math.min(255, statusColor[2] + 210)
  )
  doc.setDrawColor(...statusColor)
  doc.setLineWidth(0.5)
  doc.roundedRect(14, y, W - 28, 22, 2, 2, 'FD')
  doc.setTextColor(...statusColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const statusLabel = (reg.status || '').charAt(0).toUpperCase() + (reg.status || '').slice(1)
  doc.text(`Registration Status: ${statusLabel}`, W / 2, y + 9, { align: 'center' })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(
    reg.status === 'confirmed'
      ? 'This registration has been confirmed. Please present this document at the event.'
      : reg.status === 'cancelled'
      ? 'This registration has been cancelled and is no longer valid.'
      : 'This registration is pending confirmation from the club.',
    W / 2, y + 17, { align: 'center' }
  )

  addFooter(doc)
  const safeName  = (reg.full_name    || 'registration').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)
  const safeEvent = (reg.event_title  || '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)
  doc.save(`LRCT-Registration-${safeName}-${safeEvent}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── MEMBERSHIP APPLICATIONS LIST EXPORT ──────────────────────────────────────
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
      a.created_at ? new Date(a.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1) || '—',
    ]),
    headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
    bodyStyles: { fontSize: 7.5, textColor: [31, 41, 55], cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
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

// ── EVENT REGISTRATIONS LIST EXPORT ──────────────────────────────────────────
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
      r.event_date ? new Date(r.event_date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      r.message || '—',
      r.registered_at ? new Date(r.registered_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1) || '—',
    ]),
    headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
    bodyStyles: { fontSize: 7.5, textColor: [31, 41, 55], cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
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
  const safeName = eventFilter !== 'All' ? `-${eventFilter.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}` : ''
  doc.save(`LRCT-Registrations${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}