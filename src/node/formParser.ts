import * as ts from 'typescript';

export class ParseError extends Error{

}

export class InfoRange {
	pos: number;
	end: number
}

export class BaseInfo {
	constructor(name: string) {
		this.name = name;
	}
	name: string;
	range: InfoRange;
	source?: SourceInfo;
	ClearCircular(){
		this.source = undefined;
	}
	/**
	 * add item to this info
	 * @param item An object/var/function, will be added to info
	 */
	AddNewItem(item: BaseInfo){
		throw new ParseError('can\'t add item to BaseInfo')
	}
}

export class VariableInfo extends BaseInfo {
	initialized: boolean = false;
	value?: string;
	owner?: VariableInfo;
	GetFullName(): string[]{
		let result: string [] = [];
		if (this.owner)
			result = this.owner.GetFullName();
		result.push(name);
		return result;
	}
	/**
	 * base value, which is in this var
	 * e.g: let a = b.c.
	 * If 'this' contains VariableInfo of 'a' then refersTo will contain VariableInfo of 'c' var
	 */
	refersTo?: VariableInfo;
	FindVariable(varName: string): VariableInfo | undefined {
		if (this.name = varName) {
			return this;
		}
		return undefined;
	}
	ClearCircular(){
		this.source = undefined;
		if (this.owner)
			this.owner = this.owner.GetFullName().join('.');
		else
			this.owner = undefined;
		if (this.refersTo)
			this.refersTo = this.refersTo.GetFullName().join('.');
		else
			this.refersTo = undefined;
	}
}

export class FunctionInfo extends VariableInfo {
	AddNewItem(item: BaseInfo){
		throw new ParseError('can\'t add item to FunctionInfo')
	}
}

export class ObjectInfo extends VariableInfo {
	constructor(name: string, type?: string, range?: InfoRange, init?: boolean) {
		super(name);
		if (type)
			this.type = type;
		if (range)
			this.range = range;
		this.initialized = init || false;
	}
	FindVariable(varName: string): VariableInfo | undefined {
		let names = varName.split('.');
		if (this.name = names[0]) {
			if (names.length > 1){
				names.splice(0);
				let newName = names.join('.');
				this.props.forEach(prop => {
					let result = prop.FindVariable(newName);
					if (result) {
						return result;
					}
				});
				if (names.length = 1){
					let result = new ObjectInfo(names[0]);
					result.source = this.source;
					result.owner = this;
					return result;
				}
			}
			else
				return this;
		}
		// this.props.forEach(prop => {
		// 	let result = prop.FindVariable(varName);
		// 	if (result) {
		// 		return result;
		// 	}
		// });
		return undefined;
	}
	AddProp(newProp: VariableInfo){
		newProp.owner = this;
		this.props.push(newProp);
	}

	AddNewItem(item: BaseInfo){
		if (!(item instanceof VariableInfo))
			throw new ParseError('item is not a variable');
		(<VariableInfo>item).owner = this;
		item.source = this.source;
		if (item instanceof FunctionInfo)
			this.calls.push(item);
		else
			this.props.push(item);
		if (item instanceof FormInfo && this.source){
			this.source.AddForm(<FormInfo> item);
		}
	}
	public AddForm(form: FormInfo) {
		let source = this.source
		if (source){
			form.source = source;
			source.forms.push(form);
		}
		form.owner = this;
	}
	ClearCircular(){
		this.source = undefined;
		this.owner = undefined;
		this.refersTo = undefined;
		this.props.forEach(prop => {
			prop.ClearCircular();
		});
		this.calls.forEach(call => {
			call.ClearCircular();
		});
	}
	args: string[] = [];
	type: string;
	props: VariableInfo[] = [];
	calls: FunctionInfo[] = [];
}

export class FormInfo extends ObjectInfo {
	constructor(name: string, range?: InfoRange, init?: boolean) {
		super(name, FormInitializer, range, init);
	}
}

export class SourceInfo extends BaseInfo {
	constructor(name: string, range: InfoRange){
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
	public AddNewItem(item: BaseInfo){
		if (!(item instanceof VariableInfo))
			throw new ParseError('new item is not VariableInfo');
		item.source = this;
		if (item instanceof FormInfo){
			this.forms.push(item);
		}
		else{
			this.variables.push(item);
		}
 	}
	public FindVariable(varName: string): VariableInfo | undefined {
		this.forms.forEach(form => {
			let result = form.FindVariable(varName);
			if (result)
				return result;
		});
		// maybe it will be optional
		this.variables.forEach((variable) => {
			let result = variable.FindVariable(varName);
			if (result)
				return result;
		})
		return undefined
	}
	ClearCircular(){
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

const FormInitializer = 'NewForm';

//Additional functions

function getFullNameOfVariableInfo(expr: ts.Expression, result?: string[]): string []{
	if (!result)
		result = [];
	switch(expr.kind){
		case (ts.SyntaxKind.PropertyAccessExpression):{
			let prop = <ts.PropertyAccessExpression> expr;
			let name = prop.name;
			if (name.text){
				result.push(name.text);
			}
			let newExpr = prop.expression;
			if (newExpr){
				result = getFullNameOfVariableInfo(newExpr, result);
			}
			break;
		}
		case (ts.SyntaxKind.Identifier):{
			result.push((<ts.Identifier>expr).text);
			break;
		}
	}
	return result;
}

function MakeObject(name: string): ObjectInfo{
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
	props.forEach(property => {
		switch (property.kind) {
			case (ts.SyntaxKind.PropertyAssignment): {
				let curProp = <ts.PropertyAssignment>property;
				let name = curProp.name;
				let newProp: VariableInfo | undefined;
				switch(name.kind){
					case(ts.SyntaxKind.Identifier):{
						newProp = MakeObject((<ts.Identifier>name).text);
						break;
					}
				}
				let init = curProp.initializer;
				if (init && newProp){
					newProp = parseInitializer(init, <ObjectInfo>newProp);
				}
				if (newProp){
					newProp.source = objInfo.source;
					newProp.range = {pos: expr.pos, end: expr.end};
					objInfo.AddNewItem(newProp);
				}
				else
					throw new ParseError(`new prop doesnt exist`);
				break;
			}
		}
	});
	return objInfo
}

function parseCallExpression(call: ts.CallExpression, objInfo: BaseInfo): BaseInfo{
	let expr = call.expression;
	let result = objInfo;
	switch (expr.kind){
		case ts.SyntaxKind.Identifier:{
			let id = <ts.Identifier> expr;
			let text = id.text;
			if (text = FormInitializer){
				result = new FormInfo(objInfo.name, objInfo.range, true);
			}
		}
	}
	return result;
}

function parsePropertyAccessExpr(expr: ts.PropertyAccessExpression, source: SourceInfo): VariableInfo | undefined{
	let name = getFullNameOfVariableInfo(expr);
	let result = source.FindVariable(name.join('.'));
	return result
}

function parseInitializer(init: ts.Expression, ObjInfo: ObjectInfo): VariableInfo {
	let newInfo: VariableInfo | undefined;
	switch (init.kind) {
		case (ts.SyntaxKind.CallExpression): {
			newInfo = <ObjectInfo>parseCallExpression(<ts.CallExpression>init, ObjInfo);
			break;
		}
		case (ts.SyntaxKind.ObjectLiteralExpression): {
			let expr = <ts.ObjectLiteralExpression>init;
			newInfo = parseObjectLiteralExpression(expr, ObjInfo);
			break;
		}
		case (ts.SyntaxKind.PropertyAccessExpression):{
			let expr = <ts.PropertyAccessExpression>init;
			newInfo = ObjInfo;
			if (ObjInfo.source){
				let ref = parsePropertyAccessExpr(expr, ObjInfo.source);
				newInfo.refersTo = ref;
			}
			else
				throw new ParseError('Obj info does not contain source');
			break;
		}
		default:{
			throw new ParseError(`Syntax kind ${init.kind} is missed`);
		}
	}
	if (!newInfo)
		throw new ParseError('No one var/object was created in Initializer parse');
	return newInfo;
}

function parseVariableDeclaration(decl: ts.VariableDeclaration, info: BaseInfo): BaseInfo{
	let name = decl.name;
	let newVar: BaseInfo | undefined;
	switch(name.kind){
		case(ts.SyntaxKind.Identifier):{
			newVar = MakeObject((<ts.Identifier>name).text);
			break;
		}
	}
	let initializer = decl.initializer;
	if (initializer && newVar){
		newVar.range = {pos: decl.pos, end: decl.end};
		newVar.source = info.source;
		if (newVar instanceof ObjectInfo)
			newVar = parseInitializer(initializer, <ObjectInfo>newVar);
	}
	if (newVar){
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

function parseBinaryExpression(expr: ts.BinaryExpression, info: BaseInfo): BaseInfo{
	//TODO: parse expression token
	let src = info.source
	if (src){
		let left = expr.left
		let leftObjName = getFullNameOfVariableInfo(left);
		leftObjName = leftObjName.reverse()
		let objName = leftObjName.join('.');
		let leftObjOwner: ObjectInfo | undefined;
		/** it can be obj, obj prop or simple var/func */
		let leftObj = src.FindVariable(objName);
		//left ObjExists
		if (leftObj){
			leftObj = <ObjectInfo> parseNode(expr.right, leftObj);
			if (leftObjOwner){
				leftObj.owner = leftObjOwner;
				leftObjOwner.AddNewItem(leftObj);
			}
		}
		else{
			throw new ParseError(`left object ${objName} doesnt exist`);
		}
		return info;
	}
	throw new ParseError(`Source info is not defined`);
}

function parseNode(node: ts.Node, info?: BaseInfo): BaseInfo {
	if (!info) {
		info = new SourceInfo('', {pos: node.pos, end: node.end});
	}
	let needParseChilds = true;
	switch (node.kind) {
		case ts.SyntaxKind.ExpressionStatement:{
			let expr = (<ts.ExpressionStatement>node).expression;
			if (expr)
				parseNode(expr, info);
			break;
		}
		case ts.SyntaxKind.VariableStatement:{
			parseVariableStatement(<ts.VariableStatement>node, info);
			needParseChilds = false;
			break;
		}
		case ts.SyntaxKind.VariableDeclaration:{
			parseVariableDeclaration(<ts.VariableDeclaration>node, info);
			break;
		}
		case ts.SyntaxKind.BinaryExpression:{
			parseBinaryExpression(<ts.BinaryExpression> node, info);
			break;
		}
		case ts.SyntaxKind.CallExpression:{
			break;
		}
		default: break;
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