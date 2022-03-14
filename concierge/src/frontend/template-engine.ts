import { parse as domParser, HTMLElement } from "node-html-parser";

export namespace TemplateEngine {
  export type Variable = {
    name: string;
    value: string;
  };

  export const dom = (html: string): HTMLElement => domParser(html);

  export const appendHead = (html: HTMLElement, tags: HTMLElement[]) => {
    const head = html.querySelector("head")!;
    tags.forEach((tag) => head.appendChild(tag));
    return html;
  };

  export const prependHead = (html: HTMLElement, tags: HTMLElement[]) => {
    const head = html.querySelector("head")!;
    const innerHeadHtml = head.innerHTML;
    head.innerHTML = `${tags.map((tag) => head.appendChild(tag)).join("")}${innerHeadHtml}`;
    return html;
  };

  export const render = (html: HTMLElement, variables: Variable[] = []) => {
    const dom = html.toString();
    if (variables.length === 0) return dom;
    return variables.reduce((acc, el) => acc.replaceAll(`{{ ${el.name} }}`, el.value), dom);
  };
}
