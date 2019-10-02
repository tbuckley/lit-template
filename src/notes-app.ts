import { LitElement, html, customElement } from "lit-element";

@customElement("notes-app")
export class NotesApp extends LitElement {
    render() {
        return html`
            <div>Hello, world!</div>
        `;
    }
}