import { Router } from "express";
import Semver from "semver";
import { OptimizedJS, ViteRollup } from "../frontend/optimization";
import { Storage } from "../storage";
import { Application, ApplicationType } from "./applications";
import Crypto from "crypto";

export namespace Concierge {
  export const boot = async () => {
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
        const previousIntegrity = req.headers.integrity as string;

        if (previousIntegrity === hash) {
          return res.sendStatus(304);
        }
        res.setHeader("Integrity", hash);
        res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
        res.contentType(file.contentType);
        return res.send(file.content);
      });
    });
  };

  export const build = async (apps: Application[], storage: Storage.Interface) => {
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
        if (entryPoint.type === ApplicationType.orchestrator) {
          const html = await parser.replaceHtml(entryPoint.content);
          await app.serve(router, html);
          return;
        }
        await app.serve(router, entryPoint.content);
      })
    );
    return router;
  };
}
