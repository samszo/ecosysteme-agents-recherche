// Lecteur ZIP minimal (répertoire central + zlib) pour les snapshots Zotero, DOCX, ODT et EPUB
import zlib from "zlib";

export function isZip(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.readUInt32LE(0) === 0x04034b50;
}

// renvoie le contenu décompressé de chaque fichier de l'archive, indexé par son chemin
export function readZip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();

  // fin du répertoire central : signature 0x06054b50 dans les derniers 64 Ko
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Archive ZIP invalide");

  const count = buffer.readUInt16LE(eocd + 10);
  let p = buffer.readUInt32LE(eocd + 16);

  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(p) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(p + 10);
    // les tailles du répertoire central sont fiables même si l'entrée utilise un descripteur de données
    const compressedSize = buffer.readUInt32LE(p + 20);
    const nameLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const commentLen = buffer.readUInt16LE(p + 32);
    const localOffset = buffer.readUInt32LE(p + 42);
    const name = buffer.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // dossier
    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const data = buffer.subarray(start, start + compressedSize);
    try {
      if (method === 0) files.set(name, Buffer.from(data));
      else if (method === 8) files.set(name, zlib.inflateRawSync(data));
    } catch {
      // entrée corrompue : ignorée
    }
  }
  return files;
}
