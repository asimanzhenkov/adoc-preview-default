import * as vscode from 'vscode';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Asciidoctor = require('@asciidoctor/core');
const asciidoctor = Asciidoctor();

export class AdocPreviewProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'adocPreview.preview';

    private debounceTimers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly log: vscode.OutputChannel
    ) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {

        this.log.appendLine(`[resolveCustomTextEditor] opening: ${document.uri.fsPath}`);

        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = this.getHtmlShell(webviewPanel.webview);

        const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() !== document.uri.toString()) { return; }

            const liveReload = vscode.workspace.getConfiguration('adocPreview').get<boolean>('liveReload', true);
            if (!liveReload) { return; }

            const debounceMs = vscode.workspace.getConfiguration('adocPreview').get<number>('liveReloadDebounceMs', 300);
            const key = document.uri.toString();

            const existing = this.debounceTimers.get(key);
            if (existing) { clearTimeout(existing); }

            const timer = setTimeout(() => {
                this.log.appendLine(`[live-reload] updating: ${document.uri.fsPath}`);
                this.updatePreview(document, webviewPanel.webview);
                this.debounceTimers.delete(key);
            }, debounceMs);

            this.debounceTimers.set(key, timer);
        });

        const messageSubscription = webviewPanel.webview.onDidReceiveMessage(msg => {
            this.log.appendLine(`[webview->ext] command: ${msg.command}`);

            if (msg.command === 'ready') {
                this.log.appendLine('[webview->ext] ready received, doing initial render');
                this.updatePreview(document, webviewPanel.webview);
            }

            if (msg.command === 'openTextEditor') {
                vscode.commands.executeCommand(
                    'vscode.openWith',
                    document.uri,
                    'default',
                    { preview: false, viewColumn: vscode.ViewColumn.Active }
                );
            }
        });

        webviewPanel.onDidDispose(() => {
            changeSubscription.dispose();
            messageSubscription.dispose();
            const key = document.uri.toString();
            const t = this.debounceTimers.get(key);
            if (t) { clearTimeout(t); this.debounceTimers.delete(key); }
        });
    }

    private updatePreview(document: vscode.TextDocument, webview: vscode.Webview): void {
        try {
            const adocText = document.getText();
            const baseDir = path.dirname(document.uri.fsPath);

            this.log.appendLine(`[updatePreview] converting ${adocText.length} chars, baseDir=${baseDir}`);

            const html: string = asciidoctor.convert(adocText, {
                safe: 'safe',
                base_dir: baseDir,
                attributes: {
                    'showtitle': true,
                    'icons': 'font',
                    'source-highlighter': 'highlight.js'
                }
            });

            this.log.appendLine(`[updatePreview] converted HTML length: ${html.length}`);
            webview.postMessage({ command: 'updateContent', html });
        } catch (err) {
            this.log.appendLine(`[updatePreview] ERROR: ${err}`);
            webview.postMessage({
                command: 'updateContent',
                html: `<div style="color:var(--vscode-errorForeground);padding:1rem"><b>Render error:</b><pre>${err}</pre></div>`
            });
        }
    }

    private getHtmlShell(webview: vscode.Webview): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 style-src ${webview.cspSource} 'unsafe-inline';
                 script-src 'nonce-${nonce}';
                 img-src ${webview.cspSource} data: https:;
                 font-src ${webview.cspSource} https:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AsciiDoc Preview</title>
  <style nonce="${nonce}">
    body {
      font-family: var(--vscode-editor-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--vscode-editor-font-size, 14px);
      line-height: 1.6;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      margin: 0; padding: 0;
    }
    #toolbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 8px;
      padding: 6px 16px;
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-editor-background));
      border-bottom: 1px solid var(--vscode-editorGroup-border, transparent);
    }
    #edit-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 3px;
      background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
      color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
      font-size: 12px; cursor: pointer; white-space: nowrap;
    }
    #edit-btn:hover { background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground)); }
    #toolbar-label { font-size: 11px; color: var(--vscode-descriptionForeground); margin-left: auto; }
    #content { padding: 24px 32px; max-width: 900px; margin: 0 auto; }
    #content h1,#content h2,#content h3,#content h4,#content h5,#content h6 {
      color: var(--vscode-editor-foreground);
      border-bottom: 1px solid var(--vscode-editorGroup-border, #444);
      padding-bottom: 4px; margin-top: 1.5em;
    }
    #content a { color: var(--vscode-textLink-foreground); }
    #content a:hover { color: var(--vscode-textLink-activeForeground); }
    #content code, #content pre {
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      color: var(--vscode-editor-foreground);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family, monospace);
    }
    #content code { padding: 2px 6px; }
    #content pre  { padding: 12px 16px; overflow-x: auto; }
    #content table { border-collapse: collapse; width: 100%; }
    #content th, #content td { border: 1px solid var(--vscode-editorGroup-border, #444); padding: 6px 12px; }
    #content th { background: var(--vscode-editorGroupHeader-tabsBackground); }
    #content blockquote { border-left: 4px solid var(--vscode-textBlockQuote-border, #888); margin-left: 0; padding-left: 16px; }
    #content .admonitionblock {
      border-left: 4px solid var(--vscode-notificationsInfoIcon-foreground, #4fc3f7);
      background: var(--vscode-textCodeBlock-background, #1e1e1e);
      padding: 10px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;
    }
    #content .admonitionblock.warning, #content .admonitionblock.caution {
      border-left-color: var(--vscode-notificationsWarningIcon-foreground, #f9a825);
    }
    #content .admonitionblock.important, #content .admonitionblock.danger {
      border-left-color: var(--vscode-notificationsErrorIcon-foreground, #f44747);
    }
    #spinner { display: flex; justify-content: center; padding: 48px; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="edit-btn" title="Open source file in text editor">✎ Edit</button>
    <span id="toolbar-label">AsciiDoc Preview</span>
  </div>
  <div id="content"><div id="spinner">Loading preview…</div></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ command: 'ready' });
    document.getElementById('edit-btn').addEventListener('click', () => {
      vscode.postMessage({ command: 'openTextEditor' });
    });
    window.addEventListener('message', event => {
      const msg = event.data;
      console.log('[adoc-preview] received:', msg.command, 'html length:', msg.html ? msg.html.length : 0);
      if (msg.command === 'updateContent') {
        document.getElementById('content').innerHTML = msg.html;
      }
    });
  </script>
</body>
</html>`;
    }
}

function getNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}
