/* 
Extract from https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

Generate code with Javascript:
    Array.from(document.querySelectorAll("#content > article > div > dl > dt > a > code"))
        .map(x => x.innerText)
        .map(method => {
            const [code, ...sentence] = method.split(" ")
            return `export const Status${sentence.join("")} = ${code}`
        })
        .join("\n")
*/

import { Request } from "express";
import { Environment } from "./env";

export namespace Http {
  export const StatusSwitchingProtocols = 101;
  export const StatusProcessing = 102;
  export const StatusEarlyHints = 103;
  export const StatusOK = 200;
  export const StatusCreated = 201;
  export const StatusAccepted = 202;
  export const StatusNonAuthoritativeInformation = 203;
  export const StatusNoContent = 204;
  export const StatusResetContent = 205;
  export const StatusPartialContent = 206;
  export const StatusMultiStatus = 207;
  export const StatusAlreadyReported = 208;
  export const StatusIMUsed = 226;
  export const StatusMultipleChoice = 300;
  export const StatusMovedPermanently = 301;
  export const StatusFound = 302;
  export const StatusSeeOther = 303;
  export const StatusNotModified = 304;
  export const StatusTemporaryRedirect = 307;
  export const StatusPermanentRedirect = 308;
  export const StatusBadRequest = 400;
  export const StatusUnauthorized = 401;
  export const StatusPaymentRequired = 402;
  export const StatusForbidden = 403;
  export const StatusNotFound = 404;
  export const StatusMethodNotAllowed = 405;
  export const StatusNotAcceptable = 406;
  export const StatusProxyAuthenticationRequired = 407;
  export const StatusRequestTimeout = 408;
  export const StatusConflict = 409;
  export const StatusGone = 410;
  export const StatusLengthRequired = 411;
  export const StatusPreconditionFailed = 412;
  export const StatusPayloadTooLarge = 413;
  export const StatusURITooLong = 414;
  export const StatusUnsupportedMediaType = 415;
  export const StatusRangeNotSatisfiable = 416;
  export const StatusExpectationFailed = 417;
  export const StatusImATeapot = 418;
  export const StatusMisdirectedRequest = 421;
  export const StatusUnprocessableEntity = 422;
  export const StatusLocked = 423;
  export const StatusFailedDependency = 424;
  export const StatusTooEarly = 425;
  export const StatusUpgradeRequired = 426;
  export const StatusPreconditionRequired = 428;
  export const StatusTooManyRequests = 429;
  export const StatusRequestHeaderFieldsTooLarge = 431;
  export const StatusUnavailableForLegalReasons = 451;
  export const StatusInternalServerError = 500;
  export const StatusNotImplemented = 501;
  export const StatusBadGateway = 502;
  export const StatusServiceUnavailable = 503;
  export const StatusGatewayTimeout = 504;
  export const StatusHTTPVersionNotSupported = 505;
  export const StatusVariantAlsoNegotiates = 506;
  export const StatusInsufficientStorage = 507;
  export const StatusLoopDetected = 508;
  export const StatusNotExtended = 510;
  export const StatusNetworkAuthenticationRequired = 511;

  export const ImmutableCache = "public,max-age=31536000,immutable";
  export const NoCache = "no-cache";

  export const getDomain = (req: Request) => (Environment.prod ? `https://${req.hostname}` : `${req.protocol}://${req.hostname}`);
}
