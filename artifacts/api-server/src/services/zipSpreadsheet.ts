import { inflateRawSync } from "node:zlib";

export type SpreadsheetCell = string | number | boolean | null;

export type SpreadsheetRow = {
  rowNumber: number;
  cells: Map<number, SpreadsheetCell>;
};

type ZipEntry = {
  name: string;
  compression: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function findEndOfCentralDirectory(buffer: Buffer): number {
  const signature = 0x06054b50;
  const min = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new Error("ZIP end-of-central-directory record was not found.");
}

function listZipEntries(buffer: Buffer): ZipEntry[] {
  const endOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(endOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid ZIP central-directory entry.");
    }
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    entries.push({ name, compression, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntry(buffer: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error(`Invalid ZIP local header for ${entry.name}.`);
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataOffset = offset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compression === 0) return Buffer.from(compressed);
  if (entry.compression === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported ZIP compression method ${entry.compression} for ${entry.name}.`);
}

export function extractZipFile(buffer: Buffer, predicate: (name: string) => boolean): { name: string; data: Buffer } | null {
  const entry = listZipEntries(buffer).find((candidate) => predicate(candidate.name));
  return entry ? { name: entry.name, data: readZipEntry(buffer, entry) } : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function columnIndex(reference: string): number {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? "";
  let value = 0;
  for (const char of letters) value = value * 26 + char.charCodeAt(0) - 64;
  return value - 1;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siPattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch: RegExpExecArray | null;
  while ((siMatch = siPattern.exec(xml))) {
    const parts: string[] = [];
    const textPattern = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textPattern.exec(siMatch[1]))) parts.push(decodeXml(textMatch[1]));
    strings.push(parts.join(""));
  }
  return strings;
}

function cellAttribute(attributes: string, name: string): string | undefined {
  return attributes.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
}

function parseCellValue(attributes: string, body: string, sharedStrings: string[]): SpreadsheetCell {
  const type = cellAttribute(attributes, "t");
  if (type === "inlineStr") {
    const parts = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]));
    return parts.join("");
  }

  const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
  if (raw === undefined) return null;
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "str") return decodeXml(raw);
  if (type === "b") return raw === "1";

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : decodeXml(raw);
}

function parseWorksheet(xml: string, sharedStrings: string[]): SpreadsheetRow[] {
  const rows: SpreadsheetRow[] = [];
  const rowPattern = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(xml))) {
    const rowNumber = Number(cellAttribute(rowMatch[1], "r")) || rows.length + 1;
    const cells = new Map<number, SpreadsheetCell>();
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellPattern.exec(rowMatch[2]))) {
      const reference = cellAttribute(cellMatch[1], "r");
      if (!reference) continue;
      cells.set(columnIndex(reference), parseCellValue(cellMatch[1], cellMatch[2], sharedStrings));
    }

    rows.push({ rowNumber, cells });
  }

  const byNumber = new Map(rows.map((row) => [row.rowNumber, row]));
  const mergePattern = /<mergeCell\b[^>]*ref="([A-Z]+\d+):([A-Z]+\d+)"[^>]*\/?\s*>/g;
  let mergeMatch: RegExpExecArray | null;
  while ((mergeMatch = mergePattern.exec(xml))) {
    const startColumn = columnIndex(mergeMatch[1]);
    const endColumn = columnIndex(mergeMatch[2]);
    const startRow = Number(mergeMatch[1].match(/\d+$/)?.[0]);
    const endRow = Number(mergeMatch[2].match(/\d+$/)?.[0]);
    const value = byNumber.get(startRow)?.cells.get(startColumn);
    if (value === undefined || value === null || value === "") continue;
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      const row = byNumber.get(rowNumber);
      if (!row) continue;
      for (let column = startColumn; column <= endColumn; column += 1) {
        if (!row.cells.has(column)) row.cells.set(column, value);
      }
    }
  }

  return rows;
}

export function parseFirstWorksheetXlsx(buffer: Buffer): SpreadsheetRow[] {
  const entries = listZipEntries(buffer);
  const sharedEntry = entries.find((entry) => entry.name === "xl/sharedStrings.xml");
  const sharedStrings = sharedEntry ? parseSharedStrings(readZipEntry(buffer, sharedEntry).toString("utf8")) : [];
  const sheetEntry = entries
    .filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0];

  if (!sheetEntry) throw new Error("No worksheet XML was found in the XLSX file.");
  return parseWorksheet(readZipEntry(buffer, sheetEntry).toString("utf8"), sharedStrings);
}
