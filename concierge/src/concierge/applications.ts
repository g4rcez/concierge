import { Request, Response, Router } from "express";
import { join } from "path";
import { Optimization, OptimizedJS } from "../frontend/optimization/optimization";
import { Storage } from "../storage";
import { Strings } from "../lib/strings";
import { Middleware } from "../global";
import { Http } from "../lib/http";

export enum ApplicationType {
  orchestrator = "orchestrator",
  app = "app",
}

enum EntrypointType {
  orchestrator = "/index.html",
  app = "/index.js",
}

enum Bundler {
  viteRollup = "viteRollup",
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

  public removeFiles = (files: string[]) => {
    files.forEach((file) => this.map.delete(file));
  };

  public load = async (storage: Storage.Interface) => {
    const allFiles = await storage.listAllFiles(this.app);
    const base = Strings.url(this.app.route, this.app.version);
    await Promise.all(
      allFiles.map(async (name) => {
        const [, path] = name.split(base);
        const file = await storage.file(path, this.app);
        const mappedFile = { content: file.content, contentType: file.contentType, path };
        if (this.app.type === ApplicationType.orchestrator && path === EntrypointType.orchestrator) {
          this.map.set(rootAlias, mappedFile);
          return;
        }
        if (this.app.type === ApplicationType.app && path === EntrypointType.app) {
          this.map.set(rootAlias, mappedFile);
          return;
        }
        this.map.set(path, mappedFile);
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

  public serve = async (
    router: Router,
    staticMiddleware: Middleware[],
    entrypointMiddleware: (req: Request, res: Response, nonce: string) => Promise<string>
  ) => {
    this.map.forEach((file, key) => {
      if (key === rootAlias) {
        const path = `/${this.app.route}((/[A-Za-z0-9_-]+/?)+|/?)`;
        const sendEntrypoint = async (req: Request, res: Response) => {
          const nonce = Strings.nonce();
          const app = await entrypointMiddleware(req, res, nonce);
          res.contentType(file.contentType);
          return res.send(app);
        };
        router.get(`/${this.app.route}((/[A-Za-z0-9_-]+/?)+|/)`, sendEntrypoint);
        router.all(path, sendEntrypoint);
      } else {
        const path = `/${this.baseUrl(file.path)}`;
        router.get(path, ...staticMiddleware, (_, res) => res.contentType(file.contentType).send(file.content));
        router.all(path, ...staticMiddleware, (_, res) => res.sendStatus(Http.StatusMethodNotAllowed));
      }
    });
    console.log(`${this.app.origin}@${this.app.version} - Starts at /${this.app.route}`);
  };
}
