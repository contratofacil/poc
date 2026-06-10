import PDFDocument from 'pdfkit';
import { SearchResult } from './rag-search';
import { putDocument } from './storage/vault';

interface ResearchRow {
  id: string;
  query: string;
  mode: string;
  response_text: string | null;
  sources_json: string | null;
  summary: string | null;
  table_json: string | null;
}

interface UserInfo {
  name: string | null;
  email: string;
}

const BRAND_NAVY = '#1A2B4A';
const BRAND_GOLD = '#D4A017';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#666666';
const LINE_COLOR = '#E0E0E0';

export async function generateResearchPdf(
  search: ResearchRow,
  user: UserInfo,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 56, size: 'A4', info: { Title: 'Recherche Juridique EasyLaw' } });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const sources: SearchResult[] = search.sources_json
      ? JSON.parse(search.sources_json)
      : [];

    // ── Page footer on each page ─────────────────────────────────────────────
    const addFooter = (pageDoc: PDFKit.PDFDocument) => {
      const bottom = pageDoc.page.height - 40;
      pageDoc.fontSize(7).fillColor(TEXT_MUTED)
        .text(
          'Document généré automatiquement par EasyLaw — ne constitue pas un conseil juridique. Oliveira & Cameiro Advogados Associados.',
          56,
          bottom,
          { align: 'center', width: pageDoc.page.width - 112 },
        );
    };

    doc.on('pageAdded', () => addFooter(doc));

    // ── Header ───────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 72).fill(BRAND_NAVY);
    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
      .text('EasyLaw', 56, 20);
    doc.fontSize(10).font('Helvetica')
      .text('Recherche Juridique IA — Module B', 56, 44);
    doc.fillColor(BRAND_GOLD)
      .rect(0, 72, doc.page.width, 3).fill(BRAND_GOLD);

    doc.moveDown(2);

    // ── Metadata block ────────────────────────────────────────────────────────
    const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica')
      .text(`Généré le ${dateStr}  ·  ${user.name ?? user.email}  ·  Mode: ${search.mode === 'deepdive' ? 'DeepDive' : 'Standard'}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.strokeColor(LINE_COLOR).lineWidth(0.5).moveTo(56, doc.y).lineTo(doc.page.width - 56, doc.y).stroke();
    doc.moveDown(1);

    // ── Query ─────────────────────────────────────────────────────────────────
    doc.fillColor(BRAND_NAVY).fontSize(11).font('Helvetica-Bold').text('Question posée');
    doc.moveDown(0.3);
    doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica').text(search.query, { lineGap: 4 });
    doc.moveDown(1);

    // ── Response ──────────────────────────────────────────────────────────────
    if (search.response_text) {
      doc.fillColor(BRAND_NAVY).fontSize(11).font('Helvetica-Bold').text('Analyse juridique');
      doc.moveDown(0.3);
      doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica')
        .text(search.response_text, { lineGap: 5, align: 'justify' });
      doc.moveDown(1);
    }

    // ── Sources table ─────────────────────────────────────────────────────────
    if (sources.length > 0) {
      doc.addPage();
      doc.fillColor(BRAND_NAVY).fontSize(11).font('Helvetica-Bold').text('Sources citées');
      doc.moveDown(0.5);

      const colWidths = [70, 200, 60, 150];
      const headers = ['Source', 'Titre', 'Date', 'URL'];
      const rowHeight = 22;
      const startX = 56;
      let y = doc.y;

      // Table header
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(BRAND_NAVY);
      let x = startX;
      headers.forEach((h, i) => {
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
          .text(h, x + 4, y + 7, { width: colWidths[i] - 8, ellipsis: true });
        x += colWidths[i];
      });
      y += rowHeight;

      // Table rows
      sources.slice(0, 20).forEach((src, idx) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 80;
        }
        const bg = idx % 2 === 0 ? '#F9F9F9' : '#FFFFFF';
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bg);
        const cells = [src.source, src.title, src.date ?? '', src.url];
        x = startX;
        cells.forEach((cell, ci) => {
          if (ci === 3) {
            doc.fillColor('#1A6FC4').fontSize(7.5).font('Helvetica')
              .text(cell.slice(0, 50), x + 4, y + 7, {
                width: colWidths[ci] - 8,
                ellipsis: true,
                link: cell,
              });
          } else {
            doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica')
              .text(cell.slice(0, 80), x + 4, y + 7, { width: colWidths[ci] - 8, ellipsis: true });
          }
          x += colWidths[ci];
        });
        y += rowHeight;
      });
      doc.moveDown(1);
    }

    // ── Disclaimer footer ─────────────────────────────────────────────────────
    addFooter(doc);
    doc.end();
  });
}

export async function storeResearchPdf(
  buffer: Buffer,
  userId: string,
  searchId: string,
): Promise<string> {
  const result = await putDocument({
    buffer,
    mime_type: 'application/pdf',
    entity_type: 'other',
    entity_id: searchId,
    user_id: userId,
  });
  return result.id;
}
