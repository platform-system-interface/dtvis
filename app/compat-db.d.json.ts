export type DocsCategory = "binding" | "docs" | "driver";

export type DocsEntry = {
  category: DocsCategory;
  path: string;
};

declare const data: Record<string, DocsEntry>;

export default data;
