/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { join, isAbsolute } from 'path';
import * as nls from 'vscode-nls';
import * as fs from 'fs';

const localize = nls.config(process.env.VSCODE_NLS_CONFIG)();

function addDeclarationFiles(){
	let extensionInfo = vscode.extensions.getExtension('BazisSoft.bazis-debug');
	if (!extensionInfo){
		return;
	}
	let extensionPath = extensionInfo.extensionPath;
	//add d.ts files to folder
	try{
		let typesPath = join(vscode.workspace.rootPath, '/node_modules/@types/');
		//create directories
		//TODO: find better way, if it exists
		if (!fs.existsSync(join(vscode.workspace.rootPath, '/node_modules'))){
			fs.mkdirSync(join(vscode.workspace.rootPath, '/node_modules'));
		};
		if (!fs.existsSync(typesPath)){
			fs.mkdirSync(typesPath);
		};
		if (!fs.existsSync(join(typesPath, '/bazis'))){
			fs.mkdirSync(join(typesPath, '/bazis'));
		};
		if (!fs.existsSync(join(typesPath, '/node'))){
			fs.mkdirSync(join(typesPath, '/node'));
		};
		const experimentalRefStr = '/// <reference path="./experimental.d.ts" />';

		let mainFilename = join(typesPath, '/bazis/index.d.ts');
		//check for included experimental declaration
		let experimentalRefIncluded = false;
		if (fs.existsSync(mainFilename)){
			let prevText = fs.readFileSync(mainFilename).toString();
			let ind = prevText.indexOf(experimentalRefStr);
			experimentalRefIncluded = ind > 0 && prevText[ind - 1] != '/';
		}
		let newDeclarationText = fs.readFileSync(join(extensionPath,'/bazis.d.ts')).toString();
		// include experimental (remove excess slash) if it was included in previous file
		if (experimentalRefIncluded){
			newDeclarationText = newDeclarationText.replace('/' + experimentalRefStr, experimentalRefStr);
		}
		fs.writeFileSync(join(typesPath, '/bazis/index.d.ts'), newDeclarationText);
		fs.writeFileSync(join(typesPath, '/bazis/experimental.d.ts'), fs.readFileSync(join(extensionPath,'/experimental.d.ts')));
		if (!fs.existsSync(join(typesPath, '/node/index.d.ts'))){
			fs.writeFileSync(join(typesPath, '/node/index.d.ts'), fs.readFileSync(join(extensionPath, '/node.d.ts')));
		}
	}
	catch(e){
		//silently ignore
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
