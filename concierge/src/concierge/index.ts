import { Router } from "express";
import Semver from "semver";
import { OptimizedJS, ViteRollup } from "../frontend/optimization/optimization";
import { Storage } from "../storage";
import { Application, ApplicationType } from "./applications";
import Crypto from "crypto";
import { TemplateEngine } from "../frontend/template-engine";
import { Monitoring } from "../frontend/monitoring";
import { Security } from "../frontend/security";
import csurf from "csurf";
import { Http } from "../lib/http";

export namespace Concierge {
  export const init = async () => {
    const storage = await Storage.create("");
    const allApps = await storage.apps();
    const apps = allApps.map((app) => new Application(app));
    return { storage, apps };
  };

  const validate = (app: Application) => (app.disabled ? false : Semver.valid(app.version));

  const registerDependencies = async (deps: OptimizedJS, router: Router) => {
    deps.forEach((file) => {
      const hash = Crypto.createHash("sha256").update(file.content).digest("hex");
      router.get(file.fork, (req, res) => {
        if (req.headers.integrity === hash) {
          return res.sendStatus(304);
        }
        return res
          .setHeader("Integrity", hash)
          .setHeader("Cache-Control", "public,max-age=31536000,immutable")
          .contentType(file.contentType)
          .send(file.content);
      });
    });
  };

  export const run = async (apps: Application[], storage: Storage.Interface) => {
    const availableApps = apps.filter(validate);
    const router = Router();
    await Promise.all(
      availableApps.map(async (app) => {
        await app.load(storage);

        const parser = new ViteRollup(app);
        const commonDependencies = await parser.optimizeJsVendor();

        await registerDependencies(commonDependencies, router);
        await app.optimize(commonDependencies, parser.replaceJsImports);

        const entryPoint = app.getEntryPoint();

        const staticMiddleware = [Security.commonFilesMiddleware];

        if (entryPoint.type === ApplicationType.orchestrator) {
          const html = await parser.replaceHtml(entryPoint.content);
          const dom = TemplateEngine.parse(html);

          await app.serve(router, staticMiddleware, async (req, res, nonce) => {
            TemplateEngine.prependHead(dom, [...Monitoring.scripts(app), ...Security.scripts(nonce, Http.getDomain(req))]);
            Security.injectAppHeaders(nonce, req, res);
            return TemplateEngine.render(dom);
          });
          return;
        }
        await app.serve(router, staticMiddleware, async () => entryPoint.content);
      })
    );
    return router;
  };
}
