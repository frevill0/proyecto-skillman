// Tipos de @portal-pdp/core para el panel web (TypeScript).

export declare const ACRONYMS: string[];
export declare function isIgnored(fileName: string): boolean;
export declare function pretty(text: string): string;
export declare function clientNameFromFolder(folderName: string): string;
export declare function parseSectionFolder(folderName: string): { number: number | null; name: string };
export declare function splitExtension(fileName: string): { base: string; ext: string };
export declare const OFFICE_EXTENSIONS: string[];
export declare const CONTENT_TYPES: Record<string, string>;
export declare function stamp(bytes: Uint8Array | ArrayBuffer, client: string): Promise<Uint8Array | ArrayBuffer>;
