/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { join, isAbsolute } from 'path';
import * as nls from 'vscode-nls';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as formParser from './formParser';

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
let sourceFiles: Array<ts.SourceFile> = [];
let curTimeout: NodeJS.Timer;

// should be able to change in settings
let parseTimeout = 1500;
let updateOnEnter: boolean = true;
let updateOnSemicolon: boolean = true;


function updateForm(src: ts.SourceFile) {
	let parsedSource = formParser.parseSource(src);
}

function onDidChangeTextDocument(ev: vscode.TextDocumentChangeEvent): void {
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
			updateForm(src)
		else
			curTimeout = setTimeout(() => {
				updateForm(src);
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
		// 	src.text + `\n docVersion = ${ev.document.version}`);

	}
	catch (e) {
		vscode.window.showErrorMessage(e.message);
		if (curTimeout)
			clearTimeout(curTimeout);
	}
}

function openFormEditor() {
	try {
		if (!formOpened) {
			vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
			formOpened = true;
		}
		vscode.window.showInformationMessage('openformeditor called');
		let curDoc = vscode.window.activeTextEditor.document;
		let text = curDoc.getText();
		let fileName = curDoc.fileName;
		let src: ts.SourceFile = sourceFiles[fileName]
		if (!src) {
			src = ts.createSourceFile(curDoc.fileName, text, ts.ScriptTarget.ES2016, false);
			sourceFiles[fileName] = src;
		}
		let result = formParser.parseSource(src);
		result.ClearCircular();


		fs.writeFileSync('D:\\tmp\\src.out', JSON.stringify(src.statements));
		fs.writeFileSync('D:\\tmp\\result.out', JSON.stringify(result));

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
	vscode.commands.registerCommand('bazis-debug.addDeclarationFiles', () => {
		addDeclarationFiles();
	});

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
