import Express, { NextFunction, Request, Response } from "express";
import { Concierge } from "./concierge";
import helmet from "helmet";

const noFingerPrint = (_: Request, res: Response, next: NextFunction) => {
  res.setHeader("server", "concierge");
  return next();
};

async function main() {
  const concierge = await Concierge.boot();
  const appsRouter = await Concierge.build(concierge.apps, concierge.storage);

  const app = Express().disable("x-powered-by").use(helmet(), noFingerPrint, appsRouter);

  const server = app.listen(5000);
  return { server, app };
}

main()
  .then(() => console.log(`Starts :5000`))
  .catch();
