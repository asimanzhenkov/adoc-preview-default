import * as vscode from 'vscode';
import { AdocPreviewProvider } from './adocPreviewProvider';

export function activate(context: vscode.ExtensionContext) {
    // Create OutputChannel inside activate so VS Code registers it properly
    const log = vscode.window.createOutputChannel('AsciiDoc Preview');
    context.subscriptions.push(log);
    log.appendLine('[activate] AsciiDoc Preview extension activated');

    const provider = new AdocPreviewProvider(context, log);

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
