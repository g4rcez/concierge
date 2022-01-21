import Path from "path";
import { Environment } from "./lib/env";

export const Config = {
  localPath: Environment.prod ? "/tmp/concierge" : Path.resolve(Path.join(process.cwd(), "..", "dist")),
};
