import { Router } from "express";
import Semver from "semver";
import { Monitoring } from "../frontend/monitoring";
import { OptimizedJS } from "../frontend/optimization/optimization";
import { Security } from "../frontend/security";
import { TemplateEngine } from "../frontend/template-engine";
import { Http } from "../lib/http";
import { Storage } from "../storage";
import { Application, ApplicationType, Bundler } from "./applications";

const bundlers = {
  [Bundler.vite]: () => import("../frontend/optimization/vite"),
  [Bundler.webpack]: () => import("../frontend/optimization/webpack"),
  [Bundler.viteRollup]: () => import("../frontend/optimization/vite")
};

export namespace Concierge {
  export const init = async () => {
    const storage = await Storage.create("");
    const allApps = await storage.apps();
    const apps = allApps.map((app) => new Application(app));
    return { storage, apps };
  };

  const validate = (app: Application) => (app.disabled ? false : Semver.valid(app.version));

  const registerDependencies = async (deps: OptimizedJS, router: Router) => {
    deps.forEach((file) =>
      router.get(file.fork, (_, res) => res.setHeader("Cache-Control", Http.ImmutableCache).contentType(file.contentType).send(file.content))
    );
  };

  export const run = async (apps: Application[], storage: Storage.Interface) => {
    const availableApps = apps.filter(validate);
    const router = Router();
    await Promise.all(
      availableApps.map(async (app) => {
        await app.load(storage);
        const bundlerName = app.app.bundler;
        const ParserImpl = await bundlers[bundlerName]();
        const parser = new ParserImpl.default(app);
        const commonDependencies = await parser.optimizeJsVendor();

        await registerDependencies(commonDependencies, router);
        await app.optimize(commonDependencies, parser.replaceJsImports);

        const entryPoint = app.getEntryPoint();

        const staticMiddleware = [Security.commonFilesMiddleware];

        if (entryPoint.type === ApplicationType.orchestrator) {
          return app.serve(router, staticMiddleware, async (req, res, nonce) => {
            const domain = Http.getDomain(req);
            const htmlString = await parser.replaceHtml(entryPoint.content);
            const dom = TemplateEngine.dom(htmlString);
            const headers = Monitoring.scripts(app).concat(Security.scripts(nonce, domain));
            TemplateEngine.prependHead(dom, headers);
            Security.injectAppHeaders(req, res, nonce);
            return TemplateEngine.render(dom);
          });
        }
        return app.serve(router, staticMiddleware, async () => entryPoint.content);
      })
    );
    return router;
  };
}
