// Découpage d'un texte en extraits chevauchants coupés de préférence sur un paragraphe, une phrase ou un mot.
// Règle empirique : 1 token ≈ 4 caractères en français.
export function chunkText(text: string, maxChars: number = 15000, overlapChars: number = 1000): string[] {
  // Sécurité anti-crash pour les PDFs vides
  if (!text || typeof text !== 'string') return [];
  maxChars = Math.max(100, Math.floor(maxChars) || 15000);
  // un chevauchement ≥ la taille de l'extrait ferait reculer le découpage (boucle infinie)
  overlapChars = Math.min(Math.max(0, Math.floor(overlapChars) || 0), Math.floor(maxChars / 2));
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    const chunkEnd = currentPosition + maxChars;

    if (chunkEnd >= text.length) {
      chunks.push(text.slice(currentPosition).trim());
      break;
    }

    const slice = text.slice(currentPosition, chunkEnd);
    // une coupure n'est retenue qu'au-delà du chevauchement, sinon le découpage n'avance pas
    const minCut = overlapChars + 1;
    let cutIndex = -1;
    for (const sep of ["\n\n", ". ", " "]) {
      const i = slice.lastIndexOf(sep);
      if (i >= minCut) { cutIndex = i; break; }
    }

    const finalCut = cutIndex !== -1 ? currentPosition + cutIndex + 1 : chunkEnd;
    const piece = text.slice(currentPosition, finalCut).trim();
    if (piece) chunks.push(piece);

    // garde-fou : la position progresse toujours
    currentPosition = Math.max(finalCut - overlapChars, currentPosition + 1);
  }

  return chunks;
}
