import fs from "fs";

export namespace Files {
  export const mkdir = async (path: string) => {
    const existAssetsDir = fs.existsSync(path);
    if (existAssetsDir) return;
    fs.mkdirSync(path, { recursive: true });
  };
}
