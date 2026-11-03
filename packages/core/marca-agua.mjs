// Marca de agua "Confidencial · <cliente>" en cada página de un PDF.
// La usan el script de importación (Node) y el panel web (navegador).

import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/** Marca de agua diagonal en cada página. Si el PDF está protegido o dañado, lo devuelve tal cual. */
export async function stamp(bytes, client) {
  try {
    const pdf = await PDFDocument.load(bytes);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let text = `Confidencial · ${client}`;
    try {
      font.encodeText(text);
    } catch {
      text = 'Confidencial';
    }
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const size = Math.min(width, height) / 14;
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 6),
        y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 6),
        size,
        font,
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.18,
        rotate: degrees(30),
      });
    }
    return await pdf.save();
  } catch {
    return bytes;
  }
}
