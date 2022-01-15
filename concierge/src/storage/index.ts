import { FrontendConfig } from "../concierge/applications";
import { Local } from "./local";

export namespace Storage {
  export type File = { content: string; contentType: string };

  export type Interface = {
    apps: () => Promise<FrontendConfig[]>;
    branches: (app: FrontendConfig) => Promise<string[]>;
    listAllFiles: (app: FrontendConfig) => Promise<string[]>;
    configFile: (app: FrontendConfig) => Promise<FrontendConfig>;
    file: (path: string, app: FrontendConfig) => Promise<File>;
  };

  export const ConfigFile = "config.json";

  export type Impl = (bucket: string) => Promise<Interface>;

  export const create: Impl = () => Local("");
}
