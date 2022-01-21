import Express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { Concierge } from "./concierge";
import { Config } from "./config";
import { Files } from "./lib/files";

const noFingerPrint = (_: Request, res: Response, next: NextFunction) => {
  res.setHeader("server", "concierge");
  return next();
};

const boot = async () => {
  await Files.mkdir(Config.localPath);
};

async function main() {
  await boot();
  const concierge = await Concierge.init();
  const appsRouter = await Concierge.run(concierge.apps, concierge.storage);

  const app = Express()
    .disable("x-powered-by")
    .use(
      helmet({
        hsts: { maxAge: 31536000, preload: true },
        expectCt: { enforce: true, maxAge: 86400 },
      }),
      noFingerPrint,
      appsRouter
    );

  const server = app.listen(5000);
  return { server, app };
}

main()
  .then(() => console.log(`Starts :5000`))
  .catch();
