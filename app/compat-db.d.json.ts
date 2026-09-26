export type DocsEntry = {
  binding?: string;
  docs?: string;
  driver?: string;
};

declare const data: Record<string, DocsEntry>;

export default data;
