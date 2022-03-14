import { Request, Response } from "express";
import { HTMLElement } from "node-html-parser";
import { Middleware } from "../global";
import { Http } from "../lib/http";
import { Strings } from "../lib/strings";
import { TemplateEngine } from "./template-engine";

export namespace Security {
  export const scripts = (nonce: string, domain: string): HTMLElement[] => {
    const params: CSP.Params = { nonce, domain };
    return [
      TemplateEngine.dom(Strings.html`<base href="${domain}" />`),
      TemplateEngine.dom(Strings.html`<meta http-equiv="${CSP.header}" content="${CSP.html(params)}" />`),
      // for MaterialUI/styled-components
      TemplateEngine.dom(Strings.html`<meta property="csp-nonce" content="${nonce}" />`)
    ];
  };

  export const commonFilesMiddleware: Middleware = (req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1;mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("Access-Control-Allow-Origin", Http.getDomain(req));
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    return next();
  };

  export const injectAppHeaders = (req: Request, res: Response, nonce: string) => {
    res.setHeader("Cache-control", Http.NoCache);
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Permissions-Policy",
      `accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(self), execution-while-out-of-viewport=(self), fullscreen=(self), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), xr-spatial-tracking=(), clipboard-read=(self), clipboard-write=(self), gamepad=()`
    );
    res.setHeader("Cross-Origin-Opener-Policy", "require-corp");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader(CSP.header, CSP.http({ nonce, domain: Http.getDomain(req) }));
    return res;
  };
}

namespace CSP {
  export type Params = { domain: string; nonce: string };

  type CspRule = (params: Params) => string;

  const baseUri: CspRule = () => `base-uri 'self'`;

  const childSrc: CspRule = (params) => `child-src self 'nonce-${params.nonce}' drive.google.com`;

  const connectSrc: CspRule = (params) => `connect-src 'self' ${Strings.removeHttpProtocol(params.domain)}`;

  const cspDomains: CspRule = (params) => `${params.domain}`;

  const defaultSrc: CspRule = () => `default-src 'none'`;

  const fontSrc: CspRule = (params) => `font-src ${params.domain}`;

  const formAction: CspRule = (params) => `form-action 'self' ${params.domain} 'nonce-${params.nonce}' 'report-sample'`;

  const frameAncestor = () => `frame-ancestors 'none'`;

  const imgSrc: CspRule = (params) => `img-src 'self' ${params.domain} data:`;

  const legacyBlockAllMixedContent = () => `block-all-mixed-content`;

  const manifestSrc: CspRule = () => `manifest-src 'self'`;

  const mediaSrc: CspRule = (params) => `media-src ${params.domain}`;

  const objectSrc: CspRule = () => `object-src 'none'`;

  const prefetchSrc: CspRule = (params) => `prefetch-src 'self' ${params.domain}`;

  const scriptSrc: CspRule = (params) => `script-src ${params.domain} 'unsafe-inline' 'nonce-${params.nonce}'`;

  const scriptSrcElem: CspRule = (params) => `script-src-elem 'self' 'report-sample' 'unsafe-inline' ${cspDomains(params)} 'nonce-${params.nonce}'`;

  const styleSrc: CspRule = (params) => `style-src 'self' 'nonce-${params.nonce}'`;

  const styleSrcElementWithNonce: CspRule = (params) => `style-src-elem 'self' 'report-sample' 'nonce-${params.nonce}' ${params.domain}`;

  const upgradeInsecureRequests = () => `upgrade-insecure-requests`;

  const workerSrc = () => `worker-src 'self'`;

  const rules: CspRule[] = [
    baseUri,
    mediaSrc,
    manifestSrc,
    prefetchSrc,
    childSrc,
    connectSrc,
    defaultSrc,
    fontSrc,
    imgSrc,
    objectSrc,
    scriptSrc,
    formAction,
    scriptSrcElem,
    styleSrc,
    styleSrcElementWithNonce,
    legacyBlockAllMixedContent,
    upgradeInsecureRequests,
    workerSrc
  ];

  const joinRules = (rules: CspRule[], params: Params) => rules.map((rule) => rule(params)).join(";");

  export const html = (params: Params) => joinRules(rules, params);

  export const http = (params: Params) => joinRules([frameAncestor, ...rules], params);

  export const header = "Content-Security-Policy";
}
