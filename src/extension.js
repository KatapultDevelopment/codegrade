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

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "codegrade" is now active!');

  /*
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('codegrade.helloWorld', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from CodeGrade!');
  });
  */

 
 // let disposable = vscode.commands.registerCommand('codegrade.grade', function () {
  //   // Get the active text editor
  //   const editor = vscode.window.activeTextEditor;
  
  //   if (!editor) {
  //     vscode.window.showInformationMessage('No open editor... try opening a file');
  //     return;
  //   }
  
  //   let document = editor.document;
  
  //   // Get the document text
  //   const documentText = document.getText();
  
  //   console.log(documentText);
  // });

  // context.subscriptions.push(disposable);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Infinity);
  // const commandId = 'codegrade.gradeActiveEditor';
  // statusBar.command = commandId;
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

    let output = grader.gradeFile(editor.document);
    // let metrics = getReadabilityMetrics(editor.document);

    statusBarItem.text = `Grade: ${output.scorePercent}%`;
    statusBarItem.tooltip = new vscode.MarkdownString('*Tooltip*');
    statusBarItem.show();
  }, 500);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
  activate,
  deactivate
}
