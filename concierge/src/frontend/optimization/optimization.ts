import Path from "path";
import { Application, ApplicationFile } from "../../concierge/applications";

export type JsDependency = {
  path: string;
  fork: string;
  content: string;
} & ApplicationFile;

export type OptimizedJS = Map<string, JsDependency>;

export abstract class Optimization {
  public constructor(protected app: Application) {}
  public abstract optimizeJsVendor: () => Promise<Map<string, JsDependency>>;
  public abstract replaceHtml: (html: string) => Promise<string>;
  public abstract replaceJsImports: (
    html: string,
    baseUrl: string
  ) => Promise<string>;
  public jsVendor = (file: string) => Path.join("/@vendor/", file);
}
