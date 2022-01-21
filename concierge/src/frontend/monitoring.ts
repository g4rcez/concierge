import { Application } from "../concierge/applications";
import { Strings } from "../lib/strings";
import { TemplateEngine } from "./template-engine";

export namespace Monitoring {
  export const scripts = (app: Application) => [TemplateEngine.parse(Strings.html`<meta name="monitor-app" content="${app.name}@${app.version}"/>`)];
}
