// Une règle empirique est que 1 token ≈ 4 caractères en français.
// Pour une limite de 4000 tokens, on vise des chunks d'environ 16000 caractères.
export function chunkText(text: string, maxChars: number = 15000, overlapChars: number = 1000): string[] {
  // Sécurité anti-crash pour les PDFs vides
  if (!text || typeof text !== 'string') return [];
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  
  // On DÉCLARE la variable une seule fois ici
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = currentPosition + maxChars;

    if (chunkEnd >= text.length) {
      chunks.push(text.slice(currentPosition));
      break;
    }

    let slice = text.slice(currentPosition, chunkEnd);
    let cutIndex = slice.lastIndexOf("\n\n");

    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(". "); 
    }
    if (cutIndex === -1) {
      cutIndex = slice.lastIndexOf(" ");  
    }
    
    const finalCut = cutIndex !== -1 ? currentPosition + cutIndex + 1 : chunkEnd;

    chunks.push(text.slice(currentPosition, finalCut).trim());

    // On MODIFIE la variable sans la redéclarer (pas de 'let' ici)
    currentPosition = finalCut - overlapChars;
    
    if (currentPosition <= (finalCut - maxChars)) {
       currentPosition = finalCut; 
    }
  }

  return chunks;
}
