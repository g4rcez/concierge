import { randomBytes } from "crypto";

export namespace Strings {
  export const html = String.raw;
  export const url = (baseURL: string, ...urls: string[]) =>
    [baseURL, ...urls].reduce((acc, el) => acc.replace(/\/+$/, "") + "/" + el.replace(/^\/+/, "/"), "/");

  export const removeHttpProtocol = (url: string) => url.replace(/^https?:\/\//, "");

  export const nonce = () => randomBytes(12).toString("base64");
}
