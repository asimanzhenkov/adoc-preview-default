import * as vscode from 'vscode';
import { AdocPreviewProvider } from './adocPreviewProvider';
import { initLogger, appendLog, getLogPath } from './logger';

export function activate(context: vscode.ExtensionContext) {
    initLogger(context.globalStorageUri.fsPath);
    appendLog('[activate] AsciiDoc Preview extension activated');
    appendLog('[activate] log file: ' + getLogPath());

    const provider = new AdocPreviewProvider(context);

    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            AdocPreviewProvider.viewType,
            provider,
            {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false
            }
        )
    );

    // Register command to show log file path in notification
    context.subscriptions.push(
        vscode.commands.registerCommand('adocPreview.showLogPath', () => {
            const p = getLogPath();
            if (p) {
                vscode.window.showInformationMessage(`AsciiDoc Preview log: ${p}`, 'Copy').then(btn => {
                    if (btn === 'Copy') { vscode.env.clipboard.writeText(p); }
                });
            }
        })
    );

    // Command: preview → text editor
    context.subscriptions.push(
        vscode.commands.registerCommand('adocPreview.openTextEditor', (uri?: vscode.Uri) => {
            const target = uri ?? vscode.window.activeTextEditor?.document.uri
                ?? vscode.window.tabGroups.activeTabGroup.activeTab?.input;

            let resolvedUri: vscode.Uri | undefined;
            if (target instanceof vscode.Uri) {
                resolvedUri = target;
            } else if (target && typeof target === 'object' && 'uri' in target) {
                resolvedUri = (target as any).uri;
            }

            if (resolvedUri) {
                vscode.commands.executeCommand(
                    'vscode.openWith',
                    resolvedUri,
                    'default',
                    { preview: false, viewColumn: vscode.ViewColumn.Active }
                );
            }
        })
    );

    // Command: text editor → preview
    context.subscriptions.push(
        vscode.commands.registerCommand('adocPreview.openPreview', () => {
            const uri = vscode.window.activeTextEditor?.document.uri;
            if (uri) {
                vscode.commands.executeCommand(
                    'vscode.openWith',
                    uri,
                    AdocPreviewProvider.viewType,
                    { preview: false, viewColumn: vscode.ViewColumn.Active }
                );
            }
        })
    );
}

export function deactivate() {}
