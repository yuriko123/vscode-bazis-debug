/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { join, isAbsolute } from 'path';
import * as nls from 'vscode-nls';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as Net from 'net';
import * as cp from 'child_process';
import { bazCode } from './CodeParser';
import { bazForms } from './formCreator';
import * as Registry from 'winreg';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

function addDeclarationFiles() {
	let extensionInfo = vscode.extensions.getExtension('BazisSoft.bazis-debug');
	if (!extensionInfo) {
		return;
	}
	let extensionPath = extensionInfo.extensionPath;
	//add d.ts files to folder
	try {
		let typesPath = join(vscode.workspace.rootPath, '/node_modules/@types/');
		//create directories
		//TODO: find better way, if it exists
		if (!fs.existsSync(join(vscode.workspace.rootPath, '/node_modules'))) {
			fs.mkdirSync(join(vscode.workspace.rootPath, '/node_modules'));
		};
		if (!fs.existsSync(typesPath)) {
			fs.mkdirSync(typesPath);
		};
		if (!fs.existsSync(join(typesPath, '/bazis'))) {
			fs.mkdirSync(join(typesPath, '/bazis'));
		};
		if (!fs.existsSync(join(typesPath, '/node'))) {
			fs.mkdirSync(join(typesPath, '/node'));
		};
		const experimentalRefStr = '/// <reference path="./experimental.d.ts" />';

		let mainFilename = join(typesPath, '/bazis/index.d.ts');
		//check for included experimental declaration
		let experimentalRefIncluded = false;
		if (fs.existsSync(mainFilename)) {
			let prevText = fs.readFileSync(mainFilename).toString();
			let ind = prevText.indexOf(experimentalRefStr);
			experimentalRefIncluded = ind > 0 && prevText[ind - 1] != '/';
		}
		let newDeclarationText = fs.readFileSync(join(extensionPath, '/bazis.d.ts')).toString();
		// include experimental (remove excess slash) if it was included in previous file
		if (experimentalRefIncluded) {
			newDeclarationText = newDeclarationText.replace('/' + experimentalRefStr, experimentalRefStr);
		}
		fs.writeFileSync(join(typesPath, '/bazis/index.d.ts'), newDeclarationText);
		fs.writeFileSync(join(typesPath, '/bazis/experimental.d.ts'), fs.readFileSync(join(extensionPath, '/experimental.d.ts')));
		if (!fs.existsSync(join(typesPath, '/node/index.d.ts'))) {
			fs.writeFileSync(join(typesPath, '/node/index.d.ts'), fs.readFileSync(join(extensionPath, '/node.d.ts')));
		}
	}
	catch (e) {
		//silently ignore
	}
}

let formOpened: boolean = false;
let currentFormName: string | undefined;
let formEditorPath: string = '';
let formEditorProcess: cp.ChildProcess;

/**constants of typ */
const MessageType = {
	FormInfo: 'forminfo',
	UpdateInfo: 'update'
}
const FormEditorFileName = 'FormEditor.exe';

let sourceFiles: Array<ts.SourceFile> = [];
let curTimeout: NodeJS.Timer;
let logDir = vscode.extensions.getExtension('BazisSoft.bazis-debug').extensionPath + '\\';
let logFile = logDir + 'log.out';
let sessionLogfile = logDir + 'session.out';
let date = new Date();
//client for TCP connection to form editor

let client = new Net.Socket();

// should be able to change in settings
let parseTimeout = 1500;
let updateOnEnter: boolean = true;
let updateOnSemicolon: boolean = true;
let logging = true;
let lastSessionLogging = true;
let loggingDate = true;

let socketPort = 7800;

function CurrentDate(): string {
	return loggingDate ? `${date.getMonth() + 1}.${date.getDate() + 1} ::` : ''
}

function SessionLog(msg: string) {
	if (lastSessionLogging) {
		fs.appendFileSync(sessionLogfile, CurrentDate() + msg + '\n');
	}
}

function logError(error: string): void {
	if (logging) {
		fs.appendFileSync(logFile, `${CurrentDate()}${error}\n`);
	}
}

function ShowError(error: string): void {
	if (logging) {
		vscode.window.showErrorMessage(error);
	}
}

function sendMessage(client: Net.Socket, msg: string) {
	if (client) {
		const data = 'Content-Length: ' + Buffer.byteLength(msg, 'utf8') + '\r\n' + msg;
		//let buf = new Buffer(data, 'utf8');
		client.write(data);
		//client.push(data);
	}
}

function RunFormEditor(formInfo?: bazForms.ParsedForm) {
	if (!formOpened) {
		if (formEditorPath) {
			if (lastSessionLogging) {
				fs.writeFileSync(sessionLogfile, '');
			}
			formEditorProcess = cp.spawn(formEditorPath, ['--port', socketPort.toString()]);
			client.connect(socketPort);

			let connected = false;

			client.on('connect', err => {
				connected = true;
				if (formInfo) {
					updateFormEditor(formInfo);
				}
				//this._initialize(response);
			});

			const timeout = 10000; //timeout of 10 sec to connect

			const endTime = new Date().getTime() + timeout;
			client.on('error', err => {
				if (connected) {
					// since we are connected this error is fatal
					if (logging)
						logError('Client error:' + (err.stack || ''));
					//this._terminated('socket error');
				} else {
					// we are not yet connected so retry a few times
					if ((<any>err).code === 'ECONNREFUSED' || (<any>err).code === 'ECONNRESET') {
						const now = new Date().getTime();
						if (now < endTime) {
							setTimeout(() => {
								client.connect(socketPort);
							}, 200);		// retry after 200 ms
						} else {
							logError(`Cannot connect to runtime process: timeout after ${timeout}`)
						}
					} else {
						logError('Cannot connect to runtime process: error = ' + (<any>err).code);
					}
				}
			});

			client.on("data", (data: Buffer) => {
				logError('Data: ' + data.toString('utf8'));
				return;
			})

			client.on('end', err => {
				if (formEditorProcess)
					formEditorProcess.kill();
				formOpened = false;
				client.removeAllListeners();
				client.destroy();
			});

			formOpened = true;
		}
	}
	else if (formInfo) {
		updateFormEditor(formInfo);
	}
}


function updateSource(src: ts.SourceFile) {
	let parsedSource = bazCode.parseSource(src, logError);
	let formsInfo = bazForms.MakeForms(parsedSource, logError);
	if (currentFormName) {
		let form: bazForms.ParsedForm | undefined;
		for (let i = 0; i < formsInfo.length; i++) {
			let info = formsInfo[i];
			if (info.owner + '.' + info.name === currentFormName) {
				form = info;
				break;
			}
		}
		if (form) {
			updateFormEditor(form);
		}
	}
}

function updateFormEditor(form: bazForms.ParsedForm) {

	let message = {
		type: MessageType.FormInfo,
		info: form
	}
	let stringMsg = JSON.stringify(message);
	sendMessage(client, stringMsg);
	SessionLog(stringMsg);
}

function onDidChangeTextDocument(ev: vscode.TextDocumentChangeEvent): void {
	if (!formOpened)
		return;
	try {
		if (curTimeout)
			clearTimeout(curTimeout);
		let fileName = ev.document.fileName;
		let NeedUpdate = false;
		let src: ts.SourceFile = sourceFiles[fileName];
		if (!src)
			return;
		ev.contentChanges.forEach(element => {
			let changeRange: ts.TextChangeRange = {
				span: {
					start: ev.document.offsetAt(element.range.start),
					length: element.rangeLength
				},
				newLength: element.text.length
			}
			let newText = src.getFullText();
			newText = newText.slice(0, changeRange.span.start) + element.text +
				newText.slice(changeRange.span.start + changeRange.span.length);
			src = src.update(newText, changeRange);
			if ((updateOnEnter && element.text === '\n') || (updateOnSemicolon && element.text === ';'))
				NeedUpdate = true;
			// fs.appendFileSync('D:\\tmp\\changes.out',
			// 	'---------------------------------------\n' +
			// 	src.getFullText() + `\n --docVersion = ${ev.document.version}\n`);
		});
		sourceFiles[fileName] = src;
		if (NeedUpdate)
			updateSource(src)
		else
			curTimeout = setTimeout(() => {
				updateSource(src);
			}, parseTimeout);

		// let element = ev.contentChanges[0];
		// src.update(ev.document.getText(), {
		// 	span: {
		// 		start: element.range.start.character,
		// 		length: element.rangeLength
		// 	},
		// 	newLength: element.text.length
		// });
		// fs.appendFileSync('D:\\tmp\\changes.out',
		// 	'---------------------------------------\n' +
		// 	JSON.stringify(src.statements) + `\n docVersion = ${ev.document.version}`);

	}
	catch (e) {
		vscode.window.showErrorMessage(e.message);
		if (curTimeout)
			clearTimeout(curTimeout);
	}
}

function openFormEditor() {
	if (!formEditorPath)
		return;
	try {
		let curDoc = vscode.window.activeTextEditor.document;
		let text = curDoc.getText();
		let fileName = curDoc.fileName;
		let src: ts.SourceFile = sourceFiles[fileName]
		if (!src) {
			src = ts.createSourceFile(curDoc.fileName, text, ts.ScriptTarget.ES2016, false);
			sourceFiles[fileName] = src;
		}
		let result = bazCode.parseSource(src, logError);
		let forms = bazForms.MakeForms(result, logError);
		let formNames: string[] = [];
		for (let i = 0; i < forms.length; i++) {
			formNames.push(forms[i].owner + '.' + forms[i].name);
		}
		if (formNames.length > 0) {
			vscode.window.showQuickPick(formNames, {
				placeHolder: 'Выберите имя формы'
			}).then((value: string) => {
				if (!value)
					return;
				let index = formNames.indexOf(value);
				if (index >= 0) {
					let formInfo = forms[index];
					if (formInfo) {
						currentFormName = value;
						RunFormEditor(formInfo);
					}
				}
			})
		}
		else
			vscode.window.showErrorMessage('There is no any form');
		if (logging) {
			try {
				fs.writeFileSync(logDir + 'src.out', JSON.stringify(src.statements));
				fs.writeFileSync(logDir + 'forms.out', JSON.stringify(forms));
				result.ClearCircular();
				fs.writeFileSync(logDir + 'result.out', JSON.stringify(result));
			}
			catch (e) {/*ignore any error*/ }
		}

	}
	catch (e) {
		vscode.window.showErrorMessage(e.message);
		fs.writeFileSync('d:\\tmp\\error.out', e.stack);
	}
}

const initialConfigurations = [
	{
		type: 'bazis',
		request: 'launch',
		name: localize('bazis.launch.config.name', "Запустить"),
		sourceMaps: true,
		program: '${file}'
	}
];

export function activate(context: vscode.ExtensionContext) {
	vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument)
	vscode.commands.registerCommand('bazis-debug.addDeclarationFiles', () => {
		addDeclarationFiles();
	});

	//read settings
	let bazConfig = vscode.workspace.getConfiguration('bazis-debug');
	logging = bazConfig.get('logging', false);
	lastSessionLogging = bazConfig.get('lastSessionLogging', false);

	formEditorPath = bazConfig.get('formEditorPath', '');
	if (!formEditorPath) {
		let regKey = new Registry({
			hive: Registry.HKCU,
			key: '\\Software\\BazisSoft\\' + bazConfig.get('bazisVersion')
		})
		regKey.values((err, items) => {
			if (!err) {
				let exePath: string | undefined;
				for (var i = 0; i < items.length; i++) {
					if (items[i].name === 'Path') {
						exePath = items[i].value;
						break;
					}
				}
				if (exePath) {
					formEditorPath = path.dirname(exePath) + '\\' + FormEditorFileName;
					if (!fs.existsSync(formEditorPath))
						formEditorPath = '';
				}
			}
		});
	}

	vscode.commands.registerCommand('bazis-debug.openFormEditor', openFormEditor);

	context.subscriptions.push(vscode.commands.registerCommand('bazis-debug.provideInitialConfigurations', () => {
		const packageJsonPath = join(vscode.workspace.rootPath, 'package.json');
		let program = vscode.workspace.textDocuments.some(document => document.languageId === 'typescript') ? 'app.ts' : undefined;

		try {
			const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
			const jsonObject = JSON.parse(jsonContent);
			if (jsonObject.main) {
				program = jsonObject.main;
			} else if (jsonObject.scripts && typeof jsonObject.scripts.start === 'string') {
				program = (<string>jsonObject.scripts.start).split(' ').pop();
			}

		} catch (error) {
			// silently ignore
		}

		if (program) {
			program = isAbsolute(program) ? program : join('${workspaceRoot}', program);
			initialConfigurations.forEach(config => {
				if (!config['program']) {
					config['program'] = program || 'app.ts';
				}
			});
		}
		if (vscode.workspace.textDocuments.some(document => document.languageId === 'typescript' || document.languageId === 'coffeescript')) {
			initialConfigurations.forEach(config => {
				config['sourceMaps'] = true;
			});
		}
		// Massage the configuration string, add an aditional tab and comment out processId.
		// Add an aditional empty line between attributes which the user should not edit.
		const configurationsMassaged = JSON.stringify(initialConfigurations, null, '\t').replace(',\n\t\t"processId', '\n\t\t//"processId')
			.split('\n').map(line => '\t' + line).join('\n').trim();

		addDeclarationFiles();

		return [
			'{',
			'\t// Use IntelliSense to learn about possible Node.js debug attributes.',
			'\t// Hover to view descriptions of existing attributes.',
			'\t// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387',
			'\t"version": "0.2.0",',
			'\t"configurations": ' + configurationsMassaged,
			'}'
		].join('\n');
	}));
}

export function deactivate() {
}
