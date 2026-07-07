import * as vscode from 'vscode';
import { AdocPreviewProvider } from './adocPreviewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new AdocPreviewProvider(context);

    // Register the custom editor provider
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            AdocPreviewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        )
    );

    // Command: switch from preview → text editor
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

    // Command: switch from text editor → preview
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
