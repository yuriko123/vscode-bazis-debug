import * as ts from 'typescript';

export namespace baz {

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
		source: SourceInfo;
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
		// CopyParams(newInfo: BaseInfo) {
		// 	newInfo.range = this.range;
		// 	newInfo.source = this.source;
		// }
		// CopyVar(): ObjectInfo {
		// 	let result = new ObjectInfo(this.name);
		// 	this.CopyParams(result);
		// 	return result;
		// }
		// CopyObj(): ObjectInfo {
		// 	let result = new ObjectInfo(this.name);
		// 	this.CopyParams(result);
		// 	return result;
		// }
	}

	class ObjectArrayInfo extends BaseInfo{
		AddNewItem(item: BaseInfo) {
			if (item instanceof ObjectInfo)
				this.array.push(item);
			else
				throw new ParseError('can\'t add BaseInfo to ObjectArray')
		}
		array: Array<ObjectInfo>
	}

	class ObjectInfo extends BaseInfo {
		constructor(name: string, range?: InfoRange, init?: boolean) {
			super(name);
			if (range)
				this.range = range;
			this.initialized = init || false;
		}
		initialized: boolean = false;
		/**
		 * value of this variable (only for primitive variables)
		 */
		value?: string;
		owner?: ObjectInfo;
		/**
		 * reference to function, which creates this object
		 */
		initializer?: ObjectInfo;
		/**
		 * base value, which is in this var
		 * e.g: let a = b.c.
		 * If 'this' contains ObjectInfo of 'a' then refersTo will contain ObjectInfo of 'c' var
		 */
		refersTo?: ObjectInfo;
		props: ObjectInfo[] = [];


		/**
		 * returns full name of object like 'OwnerName.Name'
		 */
		GetFullName(): string[] {
			let result: string[] = [];
			if (this.owner) {
				if (this.owner instanceof BaseInfo)
					result = this.owner.GetFullName();
				else //result should be string
					result = this.owner.split('.');
			}
			result.push(this.name);
			return result;
		}
		/**
		 * It will replace references to string
		 */
		ConvertPointersToString() {
			if (this.owner) {
				if (this.owner instanceof ObjectInfo)
					this.owner = this.owner.GetFullName().join('.');
			}
			else
				this.owner = undefined;
			if (this.refersTo) {
				if (this.refersTo instanceof ObjectInfo)
					this.refersTo = this.refersTo.GetFullName().join('.');
			}
			else
				this.refersTo = undefined;
		}

		CopyParams(newInfo: ObjectInfo, structureOnly?: boolean) {
			newInfo.range = this.range;
			newInfo.source = this.source;
			newInfo.owner = this.owner;
			if (!structureOnly) {
				newInfo.value = this.value;
				newInfo.initialized = this.initialized;
				newInfo.refersTo = this.refersTo;
				if (newInfo instanceof ObjectInfo) {
					newInfo.props = this.props;
				}
			}
		}
		CopyVar(structureOnly?: boolean): ObjectInfo {
			let result = new ObjectInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		CopyObj(structureOnly?: boolean): ObjectInfo {
			let result = new ObjectInfo(this.name);
			this.CopyParams(result, structureOnly);
			return result;
		}
		FindFunction(names: string[]): FunctionInfo | undefined {
			if (this.name === names[0]) {
				if (names.length > 1) {
					names.splice(0, 1);
					let result: FunctionInfo | undefined;
					let newName = names;
					for (let i = 0; i < this.props.length; i++) {
						result = this.props[i].FindFunction(newName);
						if (result) {
							return result;
						}
					}
					// if no one prop was found
					// maybe it's not good to create object if names count more than one
					let newObj: ObjectInfo = names.length === 1 ? new FunctionInfo(names[0]) : new ObjectInfo(names[0]);
					newObj.source = this.source;
					newObj.owner = this;
					this.props.push(newObj);
					//
					result = newObj.FindFunction(newName);
					return result;
				}
				else {
					if (this instanceof FunctionInfo)
						return this
					else
						throw new Error(`Object ${this.GetFullName().join('.')} is not function`);
				}
			}
			return undefined;
		}
		FindVariable(names: string[]): ObjectInfo | undefined {
			if (this.name === names[0]) {
				if (names.length > 1) {
					names.splice(0, 1);
					let result: ObjectInfo | undefined;
					let newName = names;
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
		AddProp(newProp: ObjectInfo) {
			newProp.owner = this;
			this.props.push(newProp);
		}

		AddNewItem(item: BaseInfo) {
			if (!(item instanceof ObjectInfo))
				throw new ParseError('item is not a variable');
			(<ObjectInfo>item).owner = this;
			item.source = this.source;
			this.props.push(item);
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
			// this.args.forEach((arg, i, arr) => {
			// 	if (arg instanceof ObjectInfo) {
			// 		if (arg.name)
			// 			arr[i] = { name: arg.name };
			// 		else if (arg.value)
			// 			arr[i] = { value: arg.value };
			// 		else
			// 			throw new ParseError('argument have no name and no value');
			// 	}
			// })
		}
	}

	class FunctionInfo extends ObjectInfo {
		args: Array<ObjectInfo> = [];
		public Copy(): FunctionInfo{
			let result = new FunctionInfo(this.name);
			result.owner = this.owner;
			return result;
		}

	}

	class FormInfo extends ObjectInfo {
		constructor(name: string, range?: InfoRange, init?: boolean) {
			super(name, range, init);
		}
	}

	export class SourceInfo extends BaseInfo {
		constructor(name: string, range: InfoRange) {
			super(name);
			this.source = this;
			this.range = range;
			this.variables = [];
		}
		private AddVar(variable: ObjectInfo) {
			variable.source = this;
			this.variables.push(variable);
		}

		public AddNewItem(item: BaseInfo) {
			if (!(item instanceof ObjectInfo))
				throw new ParseError('new item is not ObjectInfo');
			this.AddVar(item);
		}
		/**
		 * find variable by FULL name
		 * @param fullName splitted full object name like ['OwnerName', 'Name']
		 */
		public FindVariable(fullName: string[]): ObjectInfo {
			let result: ObjectInfo | undefined;
			// maybe it will be optional
			for (let i = 0; i < this.variables.length; i++) {
				result = this.variables[i].FindVariable(fullName);
				if (result)
					return result;
			}
			//if no one variable found
			let newObj = new ObjectInfo(fullName[0]);
			this.variables.push(newObj);
			result = newObj.FindVariable(fullName);
			if (!result)
				throw new Error(`can't create variable ${fullName.join('.')} in SourceInfo.FindVariable`);
			return result;
		}
		public FindFunction(fullName: string[]): FunctionInfo {
			let result: FunctionInfo | undefined;
			// maybe it will be optional
			for (let i = 0; i < this.variables.length; i++) {
				result = this.variables[i].FindFunction(fullName);
				if (result)
					return result;
			}
			//if no one function found
			let newObj: ObjectInfo = fullName.length === 1 ? new FunctionInfo(fullName[0]) : new ObjectInfo(fullName[0]);
			this.variables.push(newObj);
			result = newObj.FindFunction(fullName);
			if (!result)
				throw new Error(`can't create function ${fullName.join('.')} in SourceInfo.FindFunction`);
			return result;

		}
		ClearCircular() {
			this.source = undefined;
			this.variables.forEach(element => {
				element.ClearCircular();
			});
		}
		variables: Array<ObjectInfo>;
	}

	//Additional functions

	function getFullNameOfObjectInfo(expr: ts.Expression, result?: string[]): string[] {
		if (!result)
			result = [];
		if (expr) {
			switch (expr.kind) {
				case (ts.SyntaxKind.PropertyAccessExpression): {
					let prop = <ts.PropertyAccessExpression>expr;
					let newExpr = prop.expression;
					if (newExpr) {
						result = getFullNameOfObjectInfo(newExpr, result);
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

	function MakeObject(name: string, source: SourceInfo, range?: InfoRange): ObjectInfo {
		let result = new ObjectInfo(name, range);
		result.source = source;
		return result;
	}

	/**
	 * Make initialization info for obj from init
	 * @param init Initializer expression
	 * @param obj Object, which initializer we need to parse
	 */
	function parseInitializer(init: ts.Expression | undefined, obj: ObjectInfo) {
		if (init) {
			switch (init.kind) {
				case (ts.SyntaxKind.ObjectLiteralExpression): {
					let expr = <ts.ObjectLiteralExpression>init;
					for (let i = 0; i < expr.properties.length; i++) {
						parseNode(expr.properties[i], obj);
					}
					break;
				}
				case (ts.SyntaxKind.CallExpression): {
					let expr = <ts.CallExpression>init;
					let func = new FunctionInfo('');
					let parsedFunc = parseNode(expr, func);
					if (parsedFunc instanceof FunctionInfo)
						obj.initializer = parsedFunc;
					else
						throw new ParseError(`initializer call isn't function`);
					break;
				}
			}
		}
	}

	/**
	 * parse variable declaration and add new variable to info
	 * @param decl Variable declaration
	 * @param info Object\Source - owner of new variable
	 */
	function parseVariableDeclaration(decl: ts.VariableDeclaration, info: BaseInfo) {
		let declName = decl.name;
		let objName = '';
		switch (declName.kind) {
			case (ts.SyntaxKind.Identifier): {
				objName = (<ts.Identifier>declName).text;
				break;
			}
		}
		if (!info.source)
			throw new ParseError(`info '${info.name}' doesn't have a source`);
		let newObj = MakeObject(objName, info.source, { pos: decl.pos, end: decl.end })
		parseInitializer(decl.initializer, newObj);
		info.AddNewItem(newObj);
	}

	function parseCallExpression(expr: ts.CallExpression, info: BaseInfo): FunctionInfo | undefined {
		let fullCallName = getFullNameOfObjectInfo(expr.expression);
		let newFunc = info.source.FindFunction(fullCallName);
		let funcArgs = new ObjectArrayInfo('');
		for (let i = 0; i < expr.arguments.length; i++)
			parseNode(expr.arguments[i], funcArgs);
		newFunc.args = newFunc.args.concat(funcArgs.array);
		if (info instanceof FunctionInfo && info.name === ''){
			return newFunc;
		}
		else {
			info.AddNewItem(newFunc);
			return undefined;
		}
	}

	function parseNode(node: ts.Node, info: BaseInfo): BaseInfo {
		let needParseChilds = false;
		switch (node.kind) {
			case ts.SyntaxKind.ExpressionStatement: {
				let expr = (<ts.ExpressionStatement>node).expression;
				if (expr)
					parseNode(expr, info);
				break;
			}
			case ts.SyntaxKind.VariableDeclaration: {
				parseVariableDeclaration(<ts.VariableDeclaration>node, info);
				break;
			}
			case ts.SyntaxKind.BinaryExpression: {
				break;
			}
			case ts.SyntaxKind.CallExpression: {
				//if node isn't
				let call = parseCallExpression(<ts.CallExpression>node, info);
				if (call){
					info = call;
				}
				break;
			}
			case ts.SyntaxKind.VariableStatement:
			case ts.SyntaxKind.SourceFile: {
				needParseChilds = true;
				break;
			}
			default: {
				// needParseChilds = true;
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


	export function parseSource(src: ts.SourceFile, errorlogger: (error: string) => void): SourceInfo {
		let result = new SourceInfo('', { pos: src.pos, end: src.end });
		try {
			result = <SourceInfo>parseNode(src, result);
		}
		catch (e) {
			if (errorlogger)
				errorlogger(e.stack);
		}
		return result;
	}
}