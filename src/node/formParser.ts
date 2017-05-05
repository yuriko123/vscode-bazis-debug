import * as ts from 'typescript';

export namespace baz {
	const FormInitializer = 'NewForm';

	class ParseError extends Error {

	}

	class InfoRange {
		pos: number;
		end: number
	}

	class BaseInfo {
		constructor(name: string) {
			this.name = name;
		}
		name: string;
		range: InfoRange;
		source?: SourceInfo;
		ClearCircular() {
			this.source = undefined;
		}
		/**
		 * add item to this info
		 * @param item An object/var/function, will be added to info
		 */
		AddNewItem(item: BaseInfo) {
			throw new ParseError('can\'t add item to BaseInfo')
		}
		CopyParams(newInfo: BaseInfo){
			newInfo.range = this.range;
			newInfo.source = this.source;
		}
		CopyVar(): VariableInfo{
			let result = new VariableInfo(this.name);
			this.CopyParams(result);
			return result;
		}
		CopyObj(): ObjectInfo{
			let result = new ObjectInfo(this.name);
			this.CopyParams(result);
			return result;
		}
	}

	class VariableInfo extends BaseInfo {
		initialized: boolean = false;
		value?: string;
		owner?: VariableInfo;
		/**
		 * base value, which is in this var
		 * e.g: let a = b.c.
		 * If 'this' contains VariableInfo of 'a' then refersTo will contain VariableInfo of 'c' var
		 */
		refersTo?: VariableInfo;
		GetFullName(): string[] {
			let result: string[] = [];
			if (this.owner) {
				if (result instanceof VariableInfo)
					result = this.owner.GetFullName();
				else //result should be string
					result = this.owner.split('.');
			}
			result.push(this.name);
			return result;
		}
		CopyParams(newInfo: VariableInfo, structureOnly?: boolean){
			newInfo.range = this.range;
			newInfo.source = this.source;
			newInfo.owner = this.owner;
			if (!structureOnly){
				newInfo.value = this.value;
				newInfo.initialized = this.initialized;
				newInfo.refersTo = this.refersTo;
			}
		}
		CopyVar(structureOnly?: boolean): VariableInfo{
			let result = new VariableInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		CopyObj(structureOnly?: boolean): ObjectInfo{
			let result = new ObjectInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		FindVariable(varName: string): VariableInfo | undefined {
			if (this.name === varName) {
				return this;
			}
			return undefined;
		}
		ClearCircular() {
			this.source = undefined;
			this.ConvertPointersToString();
		}
		/**
		 * It will replace references to string
		 */
		ConvertPointersToString() {
			if (this.owner) {
				if (this.owner instanceof VariableInfo)
					this.owner = this.owner.GetFullName().join('.');
			}
			else
				this.owner = undefined;
			if (this.refersTo) {
				if (this.refersTo instanceof VariableInfo)
					this.refersTo = this.refersTo.GetFullName().join('.');
			}
			else
				this.refersTo = undefined;
		}
	}

	class FunctionInfo extends VariableInfo {
		AddNewItem(item: BaseInfo) {
			throw new ParseError('can\'t add item to FunctionInfo')
		}
		ClearCircular(){
			this.args.forEach((arg, i, arr) =>{
				if (arg instanceof VariableInfo){
					if (arg.name)
						arr[i] = {name: arg.name};
					else if (arg.value)
						arr[i] = {value: arg.value};
					else
						throw new ParseError('argument have no name and no value');
				}
			})
		}
		args: Array<VariableInfo> = [];
	}

	class ObjectInfo extends VariableInfo {
		constructor(name: string, type?: string, range?: InfoRange, init?: boolean) {
			super(name);
			if (type)
				this.constructorFunc = type;
			if (range)
				this.range = range;
			this.initialized = init || false;
		}
		args: VariableInfo[] = [];
		constructorFunc: string;
		creator?: VariableInfo;
		props: VariableInfo[] = [];
		calls: FunctionInfo[] = [];

		CopyParams(newInfo: VariableInfo, structureOnly?: boolean){
			newInfo.range = this.range;
			newInfo.source = this.source;
			newInfo.owner = this.owner;
			if (!structureOnly){
				newInfo.value = this.value;
				newInfo.initialized = this.initialized;
				newInfo.refersTo = this.refersTo;
				if (newInfo instanceof ObjectInfo){
					newInfo.args = this.args;
					newInfo.constructorFunc = this.constructorFunc;
					newInfo.creator = this.creator;
					newInfo.props = this.props;
					newInfo.calls = this.calls;
				}
			}
		}
		CopyVar(structureOnly?: boolean): VariableInfo{
			let result = new VariableInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		CopyObj(structureOnly?: boolean): ObjectInfo{
			let result = new ObjectInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		FindVariable(varName: string): VariableInfo | undefined {
			let names = varName.split('.');
			if (this.name === names[0]) {
				if (names.length > 1) {
					names.splice(0, 1);
					let result: VariableInfo | undefined;
					let newName = names.join('.');
					for (let i = 0; i < this.props.length; i++) {
						result = this.props[i].FindVariable(newName)
						if (result) {
							return result;
						}
					}
					// if no one prop was found
					result = new ObjectInfo(names[0]);
					result.source = this.source;
					result.owner = this;
					this.props.push(result);
					//
					result = result.FindVariable(newName);
					return result;
				}
				else
					return this;
			}
			return undefined;
		}
		AddProp(newProp: VariableInfo) {
			newProp.owner = this;
			this.props.push(newProp);
		}

		AddNewItem(item: BaseInfo) {
			if (!(item instanceof VariableInfo))
				throw new ParseError('item is not a variable');
			(<VariableInfo>item).owner = this;
			item.source = this.source;
			if (item instanceof FunctionInfo)
				this.calls.push(item);
			else
				this.props.push(item);
			if (item instanceof FormInfo && this.source) {
				this.source.AddForm(<FormInfo>item);
			}
		}
		public AddForm(form: FormInfo) {
			let source = this.source
			if (source) {
				form.source = source;
				source.forms.push(form);
			}
			form.owner = this;
		}
		ClearCircular() {
			this.source = undefined;
			this.ConvertPointersToString();
			if (this.creator && this.creator instanceof ObjectInfo)
				this.creator = this.creator.GetFullName().join('.');
			this.props.forEach((prop, i, props) => {
				if (prop instanceof FormInfo)
					props.splice(i, 1);
				else
					prop.ClearCircular();
			});
			this.calls.forEach(call => {
				call.ClearCircular();
			});
			this.args.forEach((arg, i, arr) =>{
				if (arg instanceof VariableInfo){
					if (arg.name)
						arr[i] = {name: arg.name};
					else if (arg.value)
						arr[i] = {value: arg.value};
					else
						throw new ParseError('argument have no name and no value');
				}
			})
		}
	}

	class FormInfo extends ObjectInfo {
		constructor(name: string, range?: InfoRange, init?: boolean) {
			super(name, FormInitializer, range, init);
		}
	}

	export class SourceInfo extends BaseInfo {
		constructor(name: string, range: InfoRange) {
			super(name);
			this.source = this;
			this.forms = [];
			this.range = range;
			this.variables = [];
		}

		public AddForm(form: FormInfo) {
			form.source = this;
			this.forms.push(form);
		}
		private AddVar(variable: VariableInfo) {
			variable.source = this;
			this.variables.push(variable);
		}

		public AddNewItem(item: BaseInfo) {
			if (!(item instanceof VariableInfo))
				throw new ParseError('new item is not VariableInfo');
			if (item instanceof FormInfo) {
				this.AddForm(item)
			}
			else {
				this.AddVar(item);
			}
		}
		public FindVariable(varName: string): VariableInfo | undefined {
			let result: VariableInfo | undefined;
			for (let i = 0; i < this.forms.length; i++) {
				result = this.forms[i].FindVariable(varName);
				if (result)
					return result;
			}
			// maybe it will be optional
			for (let i = 0; i < this.variables.length; i++) {
				result = this.variables[i].FindVariable(varName);
				if (result)
					return result;
			}
			return undefined;
		}
		ClearCircular() {
			this.source = undefined;
			this.forms.forEach(element => {
				element.ClearCircular();
			});
			this.variables.forEach(element => {
				element.ClearCircular();
			});
		}
		forms: Array<FormInfo>;
		variables: Array<VariableInfo>;
	}

	//Additional functions

	function getFullNameOfVariableInfo(expr: ts.Expression, result?: string[]): string[] {
		if (!result)
			result = [];
		if (expr) {
			switch (expr.kind) {
				case (ts.SyntaxKind.PropertyAccessExpression): {
					let prop = <ts.PropertyAccessExpression>expr;
					let newExpr = prop.expression;
					if (newExpr) {
						result = getFullNameOfVariableInfo(newExpr, result);
					}
					let name = prop.name;
					if (name.text) {
						result.push(name.text);
					}
					break;
				}
				case (ts.SyntaxKind.Identifier): {
					result.push((<ts.Identifier>expr).text);
					break;
				}
			}
		}
		return result;
	}

	function MakeObject(name: string): ObjectInfo {
		return new ObjectInfo(name);
	}

	//parse functions

	// function parseArgs(args: ts.NodeArray<ts.Expression>, info: BaseInfo): BaseInfo{

	// }

	/**
	 * @param objInfo Info of object needs to fill
	 */
	function parseObjectLiteralExpression(expr: ts.ObjectLiteralExpression, objInfo: ObjectInfo): ObjectInfo {
		let props = expr.properties;
		objInfo.initialized = true;
		props.forEach(property => {
			switch (property.kind) {
				case (ts.SyntaxKind.PropertyAssignment): {
					let curProp = <ts.PropertyAssignment>property;
					let name = curProp.name;
					let newProp: VariableInfo | undefined;
					switch (name.kind) {
						case (ts.SyntaxKind.Identifier): {
							newProp = MakeObject((<ts.Identifier>name).text);
							break;
						}
					}
					let init = curProp.initializer;
					if (init && newProp) {
						newProp = parseInitializer(init, <ObjectInfo>newProp);
					}
					if (newProp) {
						newProp.source = objInfo.source;
						newProp.range = { pos: expr.pos, end: expr.end };
						objInfo.AddNewItem(newProp);
					}
					else
						throw new ParseError(`new prop doesnt exist`);
					break;
				}
			}
		});
		return objInfo;
	}

	function parseCallExpression(call: ts.CallExpression, info: BaseInfo): BaseInfo {
		let expr = call.expression;
		// debugger;
		switch (expr.kind) {
			case ts.SyntaxKind.Identifier: {
				let id = <ts.Identifier>expr;
				let text = id.text;
				if (info.source)
					info.source.variables.push(new FunctionInfo(text));
				break;
			}
			case ts.SyntaxKind.PropertyAccessExpression: {
				let propExpr = <ts.PropertyAccessExpression>expr;
				let ownerName = getFullNameOfVariableInfo(propExpr.expression).join('.');
				if (info.source) {
					let creator = info.source.FindVariable(ownerName);
					let type = propExpr.name.text;
					let result = new FunctionInfo(type);
					result.args = parseArguments(call.arguments);
					if (creator instanceof ObjectInfo) {
						(<ObjectInfo>creator).calls.push(result);
					}
					else
						throw new ParseError(creator instanceof VariableInfo ?
							`creator is not object` :
							`there is no owner for ${type} method`)
				}
				break;
			}
		}
		return info;
	}

	function parseCallConstructor(call: ts.CallExpression, objInfo: BaseInfo): BaseInfo {
		let expr = call.expression;
		let result = objInfo;
		switch (expr.kind) {
			case ts.SyntaxKind.Identifier: {
				let id = <ts.Identifier>expr;
				let text = id.text;
				if (text === FormInitializer) {
					result = new FormInfo(objInfo.name, objInfo.range, true);
				}
			}
			case ts.SyntaxKind.PropertyAccessExpression: {
				let propExpr = <ts.PropertyAccessExpression>expr;
				let creatorName = getFullNameOfVariableInfo(propExpr.expression).join('.');
				if (objInfo.source) {
					let creator = objInfo.source.FindVariable(creatorName);
					let type = propExpr.name.text;
					result = new ObjectInfo(objInfo.name, type, objInfo.range, true);
					(<ObjectInfo>result).creator = creator;
				}
				break;
			}
		}
		if (result instanceof ObjectInfo) {
			(<ObjectInfo>result).args = parseArguments(call.arguments);
		}
		return result;
	}

	/**
	 * returns VariableInfo if arg is primitive
	 * @param val value to copy info
	 */
	function parsePrimitive(arg: ts.Node, val?: BaseInfo): VariableInfo | undefined {
		let result: VariableInfo = val && (val instanceof VariableInfo)? val : new VariableInfo('');
		switch (arg.kind) {
			case ts.SyntaxKind.StringLiteral: {
				result.value = (<ts.StringLiteral>arg).text;
				break;
			}
			case ts.SyntaxKind.NumericLiteral: {
				result.value = (<ts.NumericLiteral>arg).text;
				break;
			}
			case ts.SyntaxKind.TrueKeyword: {
				result.value = 'true';
				break;
			}
			case ts.SyntaxKind.FalseKeyword: {
				result.value = 'false';
				break;
			}
			default:{
				return undefined;
			}
		}
		return result;
	}

	function parseArguments(args: ts.NodeArray<ts.Expression>): Array<VariableInfo> {
		let result: Array<VariableInfo> = [];
		args.forEach(arg => {
			let newVar = parsePrimitive(arg);
			if (!newVar) {
				let fullName = getFullNameOfVariableInfo(arg);
				newVar = new VariableInfo(fullName[0]);
			}
			result.push(newVar);
		})
		return result;
	}

	function parsePropertyAccessExpr(expr: ts.PropertyAccessExpression, source: SourceInfo): VariableInfo | undefined {
		let name = getFullNameOfVariableInfo(expr);
		let result = source.FindVariable(name.join('.'));
		return result
	}

	function parseInitializer(init: ts.Expression, ObjInfo: ObjectInfo): VariableInfo {
		let newInfo: VariableInfo | undefined;
		switch (init.kind) {
			case (ts.SyntaxKind.CallExpression): {
				newInfo = <ObjectInfo>parseCallConstructor(<ts.CallExpression>init, ObjInfo);
				break;
			}
			case (ts.SyntaxKind.ObjectLiteralExpression): {
				let expr = <ts.ObjectLiteralExpression>init;
				newInfo = parseObjectLiteralExpression(expr, ObjInfo);
				break;
			}
			case (ts.SyntaxKind.PropertyAccessExpression): {
				let expr = <ts.PropertyAccessExpression>init;
				newInfo = ObjInfo;
				if (ObjInfo.source) {
					let ref = parsePropertyAccessExpr(expr, ObjInfo.source);
					newInfo.refersTo = ref;
				}
				else
					throw new ParseError('Obj info does not contain source');
				break;
			}
			default: {
				newInfo = parsePrimitive(init, ObjInfo);
				if (newInfo){
					break;
				}
				throw new ParseError(`Syntax kind ${init.kind} is missed`);
			}
		}
		if (!newInfo)
			throw new ParseError('No one var/object was created in Initializer parse');
		return newInfo;
	}

	function parseVariableDeclaration(decl: ts.VariableDeclaration, info: BaseInfo): BaseInfo {
		let name = decl.name;
		let newVar: BaseInfo | undefined;
		switch (name.kind) {
			case (ts.SyntaxKind.Identifier): {
				newVar = MakeObject((<ts.Identifier>name).text);
				break;
			}
		}
		let initializer = decl.initializer;
		if (initializer && newVar) {
			newVar.range = { pos: decl.pos, end: decl.end };
			newVar.source = info.source;
			if (newVar instanceof ObjectInfo)
				newVar = parseInitializer(initializer, <ObjectInfo>newVar);
		}
		if (newVar) {
			info.AddNewItem(newVar);
		}
		else
			throw new ParseError(`new var is not defined`);
		return info;
	}

	function parseVariableStatement(statement: ts.VariableStatement, info: BaseInfo): BaseInfo {
		let declarations = statement.declarationList.declarations;
		declarations.forEach(element => {
			info = parseNode(element, info);
			// if (!newObject)
			// 	throw new ParseError('newObject is not defined');
			// info.AddNewItem(newObject);
		});
		return info
	}

	function parseBinaryExpression(expr: ts.BinaryExpression, info: BaseInfo): BaseInfo {
		//TODO: parse expression token
		let src = info.source
		if (src) {
			let left = expr.left
			let leftObjName = getFullNameOfVariableInfo(left);
			let objName = leftObjName.join('.');
			let leftObjOwner: ObjectInfo | undefined;
			/** it can be obj, obj prop or simple var/func */
			let leftObj = src.FindVariable(objName);
			//left ObjExists
			if (leftObj) {
				leftObj = <VariableInfo>parseNode(expr.right, leftObj);
				if (leftObjOwner) {
					leftObj.owner = leftObjOwner;
					leftObjOwner.AddNewItem(leftObj);
				}
			}
			else {
				throw new ParseError(`left object ${objName} doesnt exist`);
			}
			return info;
		}
		throw new ParseError(`Source info is not defined`);
	}

	function parseNode(node: ts.Node, info?: BaseInfo): BaseInfo {
		if (!info) {
			info = new SourceInfo('', { pos: node.pos, end: node.end });
		}
		let needParseChilds = false;
		switch (node.kind) {
			case ts.SyntaxKind.ExpressionStatement: {
				let expr = (<ts.ExpressionStatement>node).expression;
				if (expr)
					parseNode(expr, info);
				break;
			}
			case ts.SyntaxKind.VariableStatement: {
				parseVariableStatement(<ts.VariableStatement>node, info);
				break;
			}
			case ts.SyntaxKind.VariableDeclaration: {
				parseVariableDeclaration(<ts.VariableDeclaration>node, info);
				break;
			}
			case ts.SyntaxKind.BinaryExpression: {
				parseBinaryExpression(<ts.BinaryExpression>node, info);
				break;
			}
			case ts.SyntaxKind.CallExpression: {
				parseCallExpression(<ts.CallExpression>node, info)
				break;
			}
			default: {
				let result = parsePrimitive(node, info);
				if (result){
					break;
				}
				needParseChilds = true;
				break;
			}
		}
		if (needParseChilds)
			ts.forEachChild(node, (child) => {
				parseNode(child, info);
			})

		// node.getChildren().forEach((child)=>{
		// 	info = parseNode(child, info);
		// })
		return info;
	}


	export function parseSource(src: ts.SourceFile): SourceInfo {
		let result = <SourceInfo>parseNode(src);
		return result;
	}
}