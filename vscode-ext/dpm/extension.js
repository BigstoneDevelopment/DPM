const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH_KEY = 'dpmConfigPath';

function createDPMNode(label, commandId, icon) {
	const node = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

	node.command = {
		command: commandId,
		title: label
	};
	node.iconPath = new vscode.ThemeIcon(icon);
	node.commandId = commandId;

	return node;
}

function DPMTreeDataProvider() {
	const _onDidChangeTreeData = new vscode.EventEmitter();

	const nodes = [
		createDPMNode('Run Build', 'dpm.build', 'package'),
		createDPMNode('Run Dev', 'dpm.dev', 'play'),
		createDPMNode('Install Packages', 'dpm.installPackages', 'briefcase'),
		createDPMNode('Install Package', 'dpm.installPackage', 'symbol-function'),
		createDPMNode('Uninstall Package', 'dpm.uninstallPackage', 'symbol-function')
	];

	return {
		onDidChangeTreeData: _onDidChangeTreeData.event,
		getTreeItem: (element) => element,
		getChildren: (element) => {
			return element ? [] : nodes;
		},
		refresh: () => {
			_onDidChangeTreeData.fire();
		}
	};
}

function getDPMConfigDir(context) {
	const configPath = context.workspaceState.get(CONFIG_PATH_KEY);
	if (configPath && fs.existsSync(configPath)) {
		return path.dirname(configPath);
	}
	return null;
}

function executeDPMCommand(context, command) {
	const configDir = getDPMConfigDir(context);

	if (!configDir) {
		vscode.window.showErrorMessage('DPM configuration file path is not set or file is missing. Please open "dpm.json" and click the "Set Config" button first.');
		return;
	}

	const task = new vscode.Task(
		{ type: 'shell', dpmCommand: command },
		vscode.TaskScope.Workspace,
		`DPM: ${command}`,
		'DPM Extension',
		new vscode.ShellExecution(`dpm ${command}`, { cwd: configDir })
	);

	vscode.tasks.executeTask(task);
	vscode.window.showInformationMessage(`Running 'dpm ${command}' in directory: ${configDir}`);
};

function activate(context) {
	console.log('DPM Manager is active');

	const dpmTreeDataProvider = DPMTreeDataProvider();
	vscode.window.createTreeView('dpmManager', { treeDataProvider: dpmTreeDataProvider });

	const savedPath = context.workspaceState.get(CONFIG_PATH_KEY);
	if (savedPath) {
		if (fs.existsSync(savedPath)) {
			vscode.window.showInformationMessage(`Found DPM Config: '${savedPath}'`);
		} else {
			context.workspaceState.update(CONFIG_PATH_KEY, undefined);
			vscode.window.showWarningMessage(`Failed to find DPM Config: '${savedPath}' is missing or was deleted.`);
		};
	} else {
		vscode.window.showInformationMessage('To use the DPM Manager you need to set a config first.');
	};

	const setConfigDisposable = vscode.commands.registerCommand('dpm.setconfig', async () => {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showWarningMessage('You need to open a dpm.json file.');
			return;
		};

		const filename = activeEditor.document.uri.path.split("/").pop();
		if (filename !== "dpm.json") return vscode.window.showWarningMessage('You need to open a dpm.json file.');
		const configPath = activeEditor.document.uri.fsPath;

		try {
			await context.workspaceState.update(CONFIG_PATH_KEY, configPath);
			vscode.window.showInformationMessage(`Saved DPM Config: ${configPath}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to save DPM Config: ${error.message}`);
		};
	});

	const buildDisposable = vscode.commands.registerCommand('dpm.build', () => {
		executeDPMCommand(context, 'build');
	});

	const devDisposable = vscode.commands.registerCommand('dpm.dev', () => {
		executeDPMCommand(context, 'dev');
	});

	const installDisposable = vscode.commands.registerCommand('dpm.installPackages', () => {
		executeDPMCommand(context, 'install');
	});


	const installPackageDisposable = vscode.commands.registerCommand('dpm.installPackage', async () => {
		const packageName = await vscode.window.showInputBox({
			prompt: 'Enter package name:',
			value: "",
			placeHolder: 'user/repo/branch',
			ignoreFocusOut: true,
			validateInput: value => {
				const parts = value.replace(/^@/, "").split("/");
				let [user, repo, branch = "main"] = parts;
				if (branch == "") branch = "main";

				if (!user || !repo) {
					return `Invalid package format: ${value}`;
				};

				return null;
			}
		});
		if (!packageName || packageName == "") return;
		
		executeDPMCommand(context, `install ${packageName}`);
	});

	const uninstallPackageDisposable = vscode.commands.registerCommand('dpm.uninstallPackage', async () => {
		const packageName = await vscode.window.showInputBox({
			prompt: 'Enter package name:',
			value: "",
			placeHolder: 'user/repo/branch',
			ignoreFocusOut: true,
			validateInput: value => {
				const parts = value.replace(/^@/, "").split("/");
				let [user, repo, branch = "main"] = parts;
				if (branch == "") branch = "main";

				if (!user || !repo) {
					return `Invalid package format: ${value}`;
				};

				return null;
			}
		});
		if (!packageName || packageName == "") return;

		executeDPMCommand(context, `uninstall ${packageName}`);
	});

	context.subscriptions.push(setConfigDisposable);
	context.subscriptions.push(buildDisposable);
	context.subscriptions.push(devDisposable);
	context.subscriptions.push(installDisposable);

	context.subscriptions.push(installPackageDisposable);
	context.subscriptions.push(uninstallPackageDisposable);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
