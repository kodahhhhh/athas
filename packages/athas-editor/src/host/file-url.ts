export type FilePathUrlConverter = (path: string) => string;

let filePathUrlConverter: FilePathUrlConverter = (path) => path;

export function setFilePathUrlConverter(converter: FilePathUrlConverter | null): void {
  filePathUrlConverter = converter ?? ((path) => path);
}

export function convertFilePathToUrl(path: string): string {
  return filePathUrlConverter(path);
}
