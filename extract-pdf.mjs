import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

const buf = readFileSync('C:/LAB/contratofacil/docs/EasyLaw CDC v2.0 PRO.pdf');
const uint8 = new Uint8Array(buf);

const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true, verbosity: 0 });
const pdfDoc = await loadingTask.promise;

console.log('=== PAGES:', pdfDoc.numPages, '===\n');

for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    console.log(`\n--- PAGE ${i} ---`);
    console.log(pageText);
}
