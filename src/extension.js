// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const grader = require('./grader');

let statusBarItem;
let eventThottlingTimeout;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 3);
  
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(updateStatusBarItem));

  updateStatusBarItem();
}

function updateStatusBarItem() {

  clearTimeout(eventThottlingTimeout);

  eventThottlingTimeout = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      statusBarItem.hide();
      return
    }

    const output = grader.gradeFile(editor.document);

    statusBarItem.text = `Grade: ${output.score.total.formatted.percent}`;

    const scoreSummary = '**Scoring Summary**\n' +
      output.score.breakdown.map(x => {
        return `- **${x.name}**: ${x.formatted.percent} *(${x.formatted.fraction})*`
      }).join('\n');
    
    statusBarItem.tooltip = new vscode.MarkdownString(scoreSummary);

    statusBarItem.show();
  }, 500);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
  activate,
  deactivate
}
