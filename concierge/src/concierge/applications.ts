import { Request, Response, Router } from "express";
import { join } from "path";
import { Optimization, OptimizedJS } from "../frontend/optimization/optimization";
import { Storage } from "../storage";
import { Strings } from "../lib/strings";
import { Middleware } from "../global";
import { Http } from "../lib/http";

export enum ApplicationType {
  orchestrator = "orchestrator",
  app = "app"
}

enum EntrypointType {
  orchestrator = "/index.html",
  app = "/index.js"
}

export enum Bundler {
  vite = "vite",
  webpack = "webpack",
  viteRollup = "viteRollup"
}

export type FrontendConfig = {
  route: string;
  origin: string;
  version: string;
  roles: string[];
  bundler: Bundler;
  disabled: boolean;
  hotReload: boolean;
  type: ApplicationType;
};

const rootAlias = "@concierge/entrypoint";

export type ApplicationFile = Storage.File & { path: string };

export class Application {
  private map = new Map<string, ApplicationFile>();

  constructor(public app: FrontendConfig, public version = app.version, public name = app.route, public disabled = app.disabled) {}

  public baseUrl = (...paths: string[]) => join(this.app.route, this.app.version, ...paths).replace(/^\/+/, "/");

  public getVendorFiles = () => {
    const files = new Map<string, ApplicationFile>();
    this.map.forEach((content, key) => {
      if (key.includes("@vendor")) {
        files.set(key, content);
      }
    });
    return files;
  };

  public removeFiles = (files: string[]) => files.forEach((file) => this.map.delete(file));

  public load = async (storage: Storage.Interface): Promise<void> => {
    const allFiles = await storage.listAllFiles(this.app);
    const base = Strings.url(this.app.route, this.app.version);
    await Promise.all(
      allFiles.map(async (name) => {
        const [, path] = name.split(base);
        const file = await storage.file(path, this.app);
        const mappedFile = { content: file.content, contentType: file.contentType, path };
        const isOrchestrator = this.app.type === ApplicationType.orchestrator && path === EntrypointType.orchestrator;
        if (isOrchestrator) {
          return void this.map.set(rootAlias, mappedFile);
        }
        if (this.app.type === ApplicationType.app && path === EntrypointType.app) {
          return void this.map.set(rootAlias, mappedFile);
        }
        return void this.map.set(path, mappedFile);
      })
    );
  };

  public optimize = async (commonDependencies: OptimizedJS, transformContent: Optimization["replaceJsImports"]) => {
    commonDependencies.forEach((js) => this.map.delete(js.path));
    const baseUrl = this.baseUrl();
    await Promise.all(
      Array.from(this.map.keys()).map(async (item) => {
        const file = this.map.get(item)!;
        file.content = await transformContent(file.content, baseUrl);
      })
    );
  };

  public getEntryPoint = () => {
    const entry = this.map.get(rootAlias)!;
    return { content: entry.content, type: this.app.type };
  };

  public serve = async (router: Router, statics: Middleware[], entrypoint: (req: Request, res: Response, nonce: string) => Promise<string>) => {
    this.map.forEach((file, key) => {
      if (key === rootAlias) {
        const path = `/${this.app.route}((/[A-Za-z0-9_-]+/?)+|/?)`;
        const sendEntrypoint = async (req: Request, res: Response) => {
          const nonce = Strings.nonce();
          const app = await entrypoint(req, res, nonce);
          return res.contentType(file.contentType).send(app);
        };
        return void router.get(path, sendEntrypoint).all(path, sendEntrypoint);
      }
      const path = `/${this.baseUrl(file.path)}`;
      return void router
        .get(path, ...statics, (_, res) => res.setHeader("Cache-Control", Http.ImmutableCache).contentType(file.contentType).send(file.content))
        .all(path, ...statics, (_, res) => res.sendStatus(Http.StatusMethodNotAllowed));
    });
    console.log(`${this.app.origin}@${this.app.version} - Starts at /${this.app.route}`);
  };
}
