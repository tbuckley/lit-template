import { LitElement, html, customElement } from "lit-element";

@customElement("app-root")
export class AppRoot extends LitElement {
    render() {
        return html`
            <div>Hello, world!</div>
        `;
    }
}