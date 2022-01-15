export namespace Strings {
  export const url = (baseURL: string, ...urls: string[]) =>
    [baseURL, ...urls].reduce((acc, el) => acc.replace(/\/+$/, "") + "/" + el.replace(/^\/+/, "/"), "/");
}
