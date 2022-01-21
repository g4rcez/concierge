import { JsDependency, Optimization } from "./optimization";
import HtmlParser from "node-html-parser";
import Path from "path";
export class ViteRollup extends Optimization {
  public replaceHtml = async (html: string): Promise<string> => {
    const dom = HtmlParser(html);
    const linkModules = dom.querySelectorAll("link[rel=modulepreload]");
    linkModules.forEach((link) => {
      const linkPreModule = link.getAttribute("href")!;
      const vendor = this.jsVendor(Path.basename(linkPreModule));
      link.setAttribute("href", vendor);
    });
    return dom.toString();
  };

  public optimizeJsVendor = async () => {
    const vendorFiles = this.app.getVendorFiles();
    const changedPaths = new Map<string, JsDependency>();
    vendorFiles.forEach((file, url) => {
      const fileName = Path.basename(url);
      const newPath = this.jsVendor(fileName);
      const content = file.content.replace(/from"(\.\/([a-z0-9_\.-]+.js))"/g, (_, __, pkg) => `from"${this.jsVendor(pkg)}"`);
      changedPaths.set(newPath, { content, contentType: file.contentType, fork: newPath, path: url });
    });
    return changedPaths;
  };

  public replaceJsImports = async (content: string, baseUrl: string) =>
    content.replace(/(from|import)"\.*\/@vendor\/([a-z0-9_\.-]+.js)"/g, '$1"/@vendor/$2"').replace(/\__CONCIERGE_REPLACE_PATH__/g, baseUrl);
}
