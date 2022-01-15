import { Storage } from ".";
import FS from "fs/promises";
import Path from "path";
import glob from "glob";
import { FrontendConfig } from "../concierge/applications";
import mimeTypes from "mime-types";
import { Config } from "../config";

export const Local: Storage.Impl = async () => {
  const root = Path.join(Path.resolve(Config.localPath));
  return {
    apps: async () => {
      const dirs = await FS.readdir(root);
      return Promise.all(
        dirs.map(async (name) => {
          const configFile = Path.join(root, name, Storage.ConfigFile);
          const content = await FS.readFile(configFile, "utf-8");
          return JSON.parse(content);
        })
      );
    },
    configFile: async (app): Promise<FrontendConfig> => {
      const configFile = Path.join(root, app.origin, Storage.ConfigFile);
      const content = await FS.readFile(configFile, { encoding: "utf-8" });
      return JSON.parse(content);
    },
    branches: async (app) => {
      const path = Path.join(root, app.origin);
      const branches = await FS.readdir(path);
      return branches.map((branch) => Path.basename(branch));
    },
    file: async (path, app): Promise<Storage.File> => {
      const file = Path.join(root, app.origin, app.version, path);
      const content = await FS.readFile(file, "utf-8");
      const mimeType = mimeTypes.lookup(file);
      const contentType = mimeType ? mimeType : "application/octet-stream";
      return { content, contentType };
    },
    listAllFiles: async (app) => {
      const path = Path.join(root, app.origin, app.version, "**", "*.*");
      return new Promise((resolve, reject) => {
        glob(path, (err, files) => {
          if (err) reject(err);
          return resolve(files);
        });
      });
    },
  };
};
