import { Request, Response, NextFunction } from "express";

export type Middleware = (req: Request, res: Response, next: NextFunction) => any | Promise<any>;

export type OmitKeys<T, K extends keyof T> = Omit<T, K>;
