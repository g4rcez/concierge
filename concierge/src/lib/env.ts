export namespace Environment {
  export const NODE_ENV = process.env.NODE_ENV;
  export const prod = NODE_ENV === "production";
  export const dev = NODE_ENV === "development";
}
