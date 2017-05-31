import { bazCode } from './CodeParser';
import { bzConsts } from './formConstants';


export namespace bazForms {
	enum ParsedKind {
		Unknown = 0,
		Value = 1,
		Function = 2,
		Object = 3,
		FormComponent = 4,
		Form = 5,
		Reference = 6,
		ValueArray = 7
	}

	export class Range {
		constructor(pos?: number, end?: number) {
			this.pos = pos || 0;
			this.end = end || 0;
		}
		pos: number;
		end: number;
		IsEmpty(): boolean {
			return this.pos === -1 && this.end === -1;
		}
	}

	let nullRange = (): Range => { return new Range(-1, -1) };

	export class ParsedBase {
		name?: string;
		range: Range;
		kind: ParsedKind = ParsedKind.Unknown;
		constructor(range: Range, name: string = '') {
			this.name = name;
			this.range = range;
		}
		FindReference(fullname: string[]): ParsedBase {
			throw new Error(`FindReference: call in ${(<any>this.constructor).name}, tried to find ${fullname.join('.')} in ${this.name}`);
		}
	}

	export class ParsedReference extends ParsedBase {
		constructor(name: string, ref: ParsedBase) {
			super(nullRange(), name);
			this.reference = ref;
			this.kind = ParsedKind.Reference;
		}
		reference: ParsedBase;
	}

	export class ParsedValue extends ParsedBase {
		constructor(range: Range, name: string = '', value?: string) {
			super(range, name);
			this.value = value || '';
			this.kind = ParsedKind.Value;
		}
		value: string;
	}

	export class ParsedFunction extends ParsedBase {
		constructor(range: Range, name: string = '', args: Array<ParsedBase>) {
			super(range, name);
			this.args = args;
			this.kind = ParsedKind.Function
		}
		/**Argument can be value or function */
		args: Array<ParsedBase>;
	}

	function AddVariable(variable: ParsedBase, arr: Array<ParsedBase>, arrOwner: ParsedObject) {
		let added = false;
		arr.forEach((v, i, vars) => {
			if (!added && (v.name === variable.name)) {
				vars[i] = variable;
				added = true;
			}
		});
		if (!added) {
			arr.push(variable);
		}
	}

	export class ParsedObject extends ParsedBase {
		constructor(range: Range, name: string = '') {
			super(range, name);
			this.kind = ParsedKind.Object;
		}
		name: string;
		/** object properties */
		props: Array<ParsedBase> = [];
		/**object calls */
		calls: Array<ParsedFunction> = [];
		/** Initialization arguments */
		args: Array<ParsedBase> = [];

		FindReference(fullname: string[]): ParsedBase {
			for (let i = 0; i < this.props.length; i++) {
				let prop = this.props[i]
				if (prop.name === fullname[0]) {
					if (fullname.length > 1) {
						fullname.splice(0, 1);
						return prop.FindReference(fullname);
					}
					else
						return prop;
				}
			}
			// maybe for future
			for (let i = 0; i < this.calls.length; i++) {
				let call = this.calls[i]
				if (call.name === fullname[0]) {
					if (fullname.length > 1) {
						throw new Error('FindReference: cannot call FindReference in function object');
						//fullname.splice(0, 1);
						//call.FindReference(fullname, cb);
					}
					else
						return call;
				}
			}
			throw new Error(`FindReference: cannot find name ${fullname.join('.')} in ${this.name}`);
		}
	}

	export class ParsedComponent extends ParsedObject {
		/**
		 *
		 * @param range initialization Range
		 * @param name name of variable
		 * @param type type of component
		 */
		constructor(range: Range, name: string = '', type: string) {
			super(range, name)
			this.type = type;
			this.kind = ParsedKind.FormComponent;
			this.MakeDefaultProps();
		}
		/** Type of component (equals to it's constructor function) */
		type: string = '';
		/**
		 * array of components, created by this
		 */
		components: Array<ParsedComponent> = [];
		/**Owner's name */
		owner: string;

		MakeDefaultProps() {
			let dropDown = new ParsedObject(nullRange(), 'DropDownMenu');
			// dropDown.kind = ParsedKind.FormComponent;
			this.props.push(dropDown);
		}

		FindComponent(fullname: string[]): ParsedComponent | undefined {
			for (let i = 0; i < this.components.length; i++) {
				let comp = this.components[i]
				if (comp.name === fullname[0]) {
					if (fullname.length > 1) {
						fullname.splice(0, 1);
						return comp.FindComponent(fullname);
					}
					else
						return comp;
				}
			}
			return undefined;
		}
	}

	export class ParsedForm extends ParsedComponent {
		constructor(range: Range, name: string = '') {
			super(range, name, bzConsts.Constructors.NewForm);
			this.kind = ParsedKind.Form;
			this.MakeDefaultProps();
		}

		owner: string = '';

		MakeDefaultProps() {
			AddVariable(new ParsedComponent(nullRange(), 'Properties', ''), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'OKButton', 'false'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'OKButtonCaption', 'ОК'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'CancelButton', 'false'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'CancelButtonCaption', 'Отмена'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'MinHeight', '200'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'MinWidth', '200'), this.props, this);
			AddVariable(new ParsedValue(nullRange(), 'Caption', ''), this.props, this);
		}

	}

	export class FormsInfo extends Array<ParsedForm>{
		values: Array<ParsedBase> = [];
		references: Array<ParsedReference> = [];
	}

	/**
	 * Get variable by fullname. Throws an error if variable doesn't exist
	 * @param fullname full name of variable
	 */
	function GetReference(fullname: string | string[]): ParsedBase {
		//it should be never
		if (!forms)
			throw new Error('Forms Array isn\'t initialized');
		let result: ParsedBase | undefined;
		let names: string[] = typeof fullname === 'string' ? (<string>fullname).split('.') : fullname;
		if (names.length === 0)
			throw new Error(`FindReference: fullname cannot be empty`);
		for (let i = 0; i < forms.length; i++) {
			let form = forms[i];
			if (form.name === names[0]) {
				result = form;
				break;
			}
		};
		if (!result) {
			for (let i = 0; i < forms.values.length; i++) {
				let val = forms.values[i];
				if (val.name === names[0]) {
					result = val;
					break;
				}
			};
			if (!result)
				for (let i = 0; i < forms.references.length; i++) {
					let ref = forms.references[i];
					if (ref.name === names[0]) {
						result = ref.reference;
						break
					}
				};
		}
		if (!result) {
			throw new Error(`FindReference: cannot find variable '${typeof fullname === 'string' ? fullname : fullname.join('.')}'`);
		}
		else {
			if (names.length > 1) {
				names.splice(0, 1);
				return result.FindReference(names);
			}
			else {
				return result;
			}
		}
	}

	function AddVariableToOwner(val: ParsedBase, valOwner: ParsedBase) {
		//get real object from references
		while (valOwner instanceof ParsedReference) {
			valOwner = valOwner.reference;
		}
		if (valOwner instanceof ParsedObject) {
			if (val.kind === ParsedKind.Function) {
				AddVariable(val, valOwner.calls, valOwner)
			}
			// valOwner.calls.push(<ParsedFunction>val);
			else {
				AddVariable(val, valOwner.props, valOwner)
			}
			// valOwner.props.push(variable);
		}
		else {
			throw new Error(`FillVariable: owner of property ${val.name} has incorrect type: ${(<any>valOwner.constructor).name} `);
		}
	}

	function FillVariable(varInfo: bazCode.ObjectInfo, variable: ParsedBase, owner?: ParsedBase) {
		if (!variable.name)
			return;
		if (!varInfo.owner && !owner) {
			forms.values.push(variable);
		}
		else {
			let valOwner = owner;
			if (!valOwner) {
				if (varInfo.owner instanceof bazCode.ObjectInfo) {
					let fullOwnerName = varInfo.owner.GetFullName();
					let ref = GetReference(fullOwnerName);
					AddVariableToOwner(variable, ref);
				}
				// if (varInfo.owner instanceof ) {
				// 	let fullOwnerName = varInfo.owner.GetFullName();
				// 	valOwner = GetReference(fullOwnerName);
				// }
			}
			else {
				AddVariableToOwner(variable, valOwner);
			}
		}
	}

	function ParseObject(obj: bazCode.ObjectInfo, owner?: ParsedBase): ParsedBase {
		let result: ParsedObject;
		//if object was created by calling a function
		let args: Array<ParsedBase> = [];
		if (obj.initializer) {
			let init = obj.initializer;
			if (init instanceof bazCode.FunctionInfo) {
				let initArgs = init.args;
				initArgs.forEach(arg => {
					let newArg = ParseVar(arg);
					if (newArg)
						args.push(newArg);
					else
						args.push(new ParsedValue(nullRange(), '', undefined));
				});
			}
			//if initializer is global
			if (!init.owner) {
				if (init.name === bzConsts.Constructors.NewForm) {
					let form = new ParsedForm(obj.range, obj.name);
					if (obj.owner) {
						form.owner = obj.owner.GetFullName().join('.')
					}
					form.args = args;
					forms.push(form);
					return form;
				}
				else {
					result = new ParsedObject(obj.range, obj.name);
					result.args = args;
				}
			}
			else {
				let initOwner = init.owner;
				let objOwner = GetReference(initOwner.GetFullName());
				if (objOwner.kind === ParsedKind.Reference) {
					objOwner = (<ParsedReference>objOwner).reference;
				}
				if ((objOwner instanceof ParsedComponent) && bzConsts.IsComponentConstructor(init.name)) {
					result = new ParsedComponent(obj.range, obj.name, init.name);
					if (obj.owner) {
						(<ParsedComponent>result).owner = obj.owner.GetFullName().join('.');
					}
					result.args = args;
					objOwner.components.push(<ParsedComponent>result);
					return result;
				}
			}
		}
		result = new ParsedObject(obj.range, obj.name)
		result.args = args;
		return result;
	}

	function ParseFunction(func: bazCode.FunctionInfo, owner?: ParsedBase): ParsedBase {
		let args: Array<ParsedBase> = [];
		func.args.forEach(arg => {
			let newArg = ParseVar(arg)
			if (newArg)
				args.push(newArg);
			else
				args.push(new ParsedValue(nullRange(), '', undefined));
		})
		let result = new ParsedFunction(func.range, func.name, args);
		return result;
	}

	/**
	 *
	 * @param variable ObjectInfo of code parsed variabale
	 * @param owner owner of new variable
	 */

	function ParseVar(variable: bazCode.ObjectInfo, owner?: ParsedBase): ParsedBase | undefined {
		if (!forms)
			throw new Error('Forms info isn\'t initialized');
		if (!variable.initialized && variable.kind != bazCode.InfoKind.FunctionInfo) {
			return undefined;
		}
		//search for already pushed variable to avoid duplicates
		// {
		// 	let existedVar = FindVariable(variable.GetFullName());
		// 	if (existedVar)
		// 		return existedVar;
		// }
		//make new variable
		let newVar: ParsedBase;
		switch (variable.kind) {
			case bazCode.InfoKind.ObjectInfo: {
				//newVar = new ParsedObject(variable.range, variable.name);
				newVar = ParseObject(variable, owner);
				FillVariable(variable, newVar, owner);
				break;
			}
			case bazCode.InfoKind.FunctionInfo: {
				newVar = ParseFunction(<bazCode.FunctionInfo>variable, owner);
				FillVariable(variable, newVar, owner);
				break;
			}
			case bazCode.InfoKind.ValueInfo: {
				newVar = new ParsedValue(variable.range, variable.name, variable.value); //ParseObject(variable, owner);
				FillVariable(variable, newVar, owner);
				// ParseValue(variable);
				break;
			}
			case bazCode.InfoKind.ReferenceInfo: {
				let refName = variable.refersTo.GetFullName();
				let ref = GetReference(refName);
				newVar = new ParsedReference(variable.name, ref);
				FillVariable(variable, newVar, owner);
				break;
			}
			default: {
				throw new Error(`InfoKind ${variable.kind} doesn't support`);
			}
		}
		// variable.props.forEach(prop => {
		// 	ParseVar(prop, newVar);
		// });
		return newVar;
	}

	/**
	 * returns array of forms, available in given source
	 * @param parsedSource Source, parsed by CodeParser and WITHOUT clearing circular
	 */
	export function MakeForms(parsedSource: bazCode.SourceInfo, errorlogger: (error: string) => void): FormsInfo {
		let result = new FormsInfo();
		forms = result;
		try {
			parsedSource.variables.forEach((variable) => {
				ParseVar(variable);
			})
		}
		catch (e) {
			errorlogger(e.stack);
		}
		forms = <any>undefined;
		return result;
	}
	let forms: FormsInfo;

	// export class ComponentChanges {
	// 	constructor(name: string) {
	// 		this.name = name;
	// 	}
	// 	name: string;
	// 	props: Array<ParsedBase> = [];
	// 	calls: Array<ParsedBase> = [];
	// 	components: Array<ComponentChanges> = [];
	// 	IsEmpty(): boolean {
	// 		return this.components.length === 0 && this.props.length === 0 && this.calls.length === 0;
	// 	}
	// }
	// function VariablesEqual(oldVar: ParsedBase, newVar: ParsedBase) {
	// 	if (oldVar.kind === newVar.kind) {
	// 		switch (oldVar.kind) {
	// 			case ParsedKind.Value: {
	// 				return (ValuesEqual((<ParsedValue>oldVar), (<ParsedValue>newVar)));
	// 			};
	// 			case ParsedKind.Function: {
	// 				return FunctionsEqual(<ParsedFunction>oldVar, <ParsedFunction>newVar);
	// 			}
	// 			default:
	// 				return true;
	// 		}
	// 	}
	// 	return false;
	// }


	// function ValuesEqual(oldValue: ParsedValue, newVal: ParsedValue) {
	// 	return (oldValue.value === newVal.value);
	// }

	// function FunctionsEqual(oldFunc: ParsedFunction, newFunc: ParsedFunction) {
	// 	let result = (oldFunc.args.length === newFunc.args.length);
	// 	if (result) {
	// 		oldFunc.args.forEach((element, i, args) => {
	// 			if (!VariablesEqual(element, newFunc.args[i]))
	// 				result = false;
	// 		});
	// 	}
	// 	return result;
	// }

	// // function CompareObjects(oldObj: ParsedObject, newObj: ParsedObject, owner: ComponentChanges){

	// // }

	// function CompareComponents(oldComp: ParsedComponent, newComp: ParsedComponent, owner: ComponentChanges) {
	// 	if (oldComp.name !== newComp.name)
	// 		return
	// 	let result = new ComponentChanges(oldComp.name);
	// 	(<ParsedComponent>oldComp).props.forEach(prop => {
	// 		let newChildProp = (<ParsedComponent>newComp).FindReference([prop.name || '']);
	// 		if (newChildProp) {
	// 			WriteChanges(prop, newChildProp, result);
	// 		}
	// 	});
	// 	(<ParsedComponent>oldComp).calls.forEach(call => {
	// 		let newChildProp = (<ParsedComponent>newComp).FindReference([call.name || '']);
	// 		if (newChildProp) {
	// 			WriteChanges(call, newChildProp, result);
	// 		}
	// 	});
	// 	(<ParsedComponent>oldComp).components.forEach(comp => {
	// 		let newChildComp = (<ParsedComponent>newComp).FindComponent([comp.name]);
	// 		if (newChildComp) {
	// 			CompareComponents(comp, newChildComp, owner);
	// 		}
	// 	})
	// 	if (!result.IsEmpty()) {
	// 		owner.components.push(result);
	// 	}
	// 	//WriteChanges(oldComp, newComp, result);
	// 	// oldComp.components.forEach(element => {
	// 	// 	if () {
	// 	// 		WriteChanges(element, newComp, result);
	// 	// 	}
	// 	// 	else {
	// 	// 		//TODO: if prop doesnt exist;
	// 	// 	}
	// 	// });
	// }

	// function WriteChanges(oldProp: ParsedBase, newProp: ParsedBase, owner: ComponentChanges) {
	// 	if (!VariablesEqual(oldProp, newProp)) {
	// 		if (newProp.kind === ParsedKind.Function)
	// 			owner.calls.push(newProp);
	// 		else
	// 			owner.props.push(newProp);
	// 	}
	// 	else {
	// 		switch (newProp.kind) {
	// 			case ParsedKind.FormComponent: {
	// 				CompareComponents(<ParsedComponent>oldProp, <ParsedComponent>newProp, owner)
	// 				// (<ParsedComponent>oldProp).components.forEach(comp =>{
	// 				// 	let newComp = (<ParsedComponent>newProp).FindComponent([comp.name]);
	// 				// 	if (newComp){
	// 				// 		CompareComponents(comp, newComp, owner);
	// 				// 	}
	// 				// })
	// 				break;
	// 			}
	// 			case ParsedKind.Object: {
	// 				(<ParsedObject>oldProp).props.forEach(prop => {
	// 					let newChildProp = (<ParsedObject>newProp).FindReference([prop.name || '']);
	// 					if (newChildProp) {
	// 						WriteChanges(prop, newChildProp, owner);
	// 					}
	// 				})
	// 				break;
	// 			}
	// 			default: {
	// 				break;
	// 			}
	// 		}
	// 	}
	// }

	// /**
	//  * Find property in component, removes it from component and returns as result. Return undefined if prop not found
	//  * @param component
	//  */
	// function SpliceProperty(component: ParsedComponent, propname: string): ParsedBase | undefined {
	// 	for (let i = 0; i < component.props.length; i++) {
	// 		let prop = component.props[i];
	// 		if (prop.name === propname) {
	// 			component.props.splice(i, 1);
	// 			return prop;
	// 		}
	// 	}
	// 	return undefined;
	// }

	// function MakeChanges(oldForm: ParsedForm, newForm: ParsedForm): ComponentChanges | undefined {
	// 	let newProps = <ParsedComponent>SpliceProperty(newForm, 'Properties');//<ParsedComponent>newForm.FindReference(['Properties']);
	// 	if (!newProps || newProps.kind !== ParsedKind.FormComponent)
	// 		return;
	// 	let result = new ComponentChanges(oldForm.name);
	// 	oldForm.props.forEach(prop => {
	// 		if (prop.name === 'Properties' && prop.kind === ParsedKind.FormComponent) {
	// 			let comp = <ParsedComponent>prop;
	// 			comp.components.forEach(element => {
	// 				let newComp = newProps.FindComponent([element.name]);
	// 				if (newComp) {
	// 					WriteChanges(element, newComp, result);
	// 				}
	// 				else {
	// 					//TODO: if comp doesnt exist;
	// 				}
	// 			});

	// 		} else {
	// 			let NewProp = SpliceProperty(newForm, <any>prop.name);
	// 			if (NewProp) {
	// 				WriteChanges(prop, NewProp, result);
	// 			}
	// 		}
	// 	});
	// 	return result
	// }

	// export function MakeFormUpdates(oldFormInfo: ParsedForm, newSource: bazCode.SourceInfo,
	// 	errorlogger: (error: string) => void): ComponentChanges | undefined {
	// 	try {
	// 		let newForms = MakeForms(newSource, errorlogger);
	// 		let newFormInfo: ParsedForm | undefined;
	// 		for (let i = 0; i < newForms.length; i++) {
	// 			if (newForms[i].name === oldFormInfo.name) {
	// 				newFormInfo = newForms[i];
	// 				break;
	// 			}
	// 		}
	// 		if (newFormInfo) {
	// 			let result = MakeChanges(oldFormInfo, newFormInfo);
	// 			return result;
	// 		}
	// 	}
	// 	catch (e) {
	// 		errorlogger(e.stack);
	// 	}
	// 	return undefined;
	// }

	enum ChangeState {
		none = 0,
		deleted = 1,
		modified = 2,
		created = 3
	}
	export class BaseChange {
		constructor(name: string, state?: ChangeState) {
			this.name = name;
			this.state = state || ChangeState.none;
		}
		state: ChangeState;
		name: string;
	}
	export class PropChange extends BaseChange {
		value: string;
	}

	export class CallChange extends BaseChange {
		args: Array<PropChange> = [];

		Changed(): boolean {
			let result = false;
			this.args.forEach(arg => {
				if (arg.state !== ChangeState.none)
					result = true;
			})
			return result;
		}
	}
	export class ObjectChange extends BaseChange {
		props: Array<PropChange> = [];
		calls: Array<CallChange> = [];
		Empty(): boolean {
			return this.props.length === 0 &&
				this.calls.length === 0;
		}
	}

	export class ComponentChange extends ObjectChange {
		components: Array<ComponentChange> = [];
		Empty(): boolean {
			return this.props.length === 0 &&
				this.calls.length === 0 &&
				this.components.length === 0;
		}
	}

	export class FormChange extends ComponentChange {

	}

	function SpliceElement(element: ParsedBase, arr: Array<ParsedBase>): ParsedBase | undefined {
		let result: ParsedBase | undefined;
		for (let i = 0; i < arr.length; i++) {
			if (element.name === arr[i].name)
				return arr.splice(i, 1)[0];
		}
		return result;
	}

	/**
	 * Compare old and new props (if they exist)
	 * @param oldProps Old properties
	 * @param newProps New properties (they should be; if they don't exist, there is no sense to call this function)
	 * @param owner Properties' owner (Object, which have them)
	 */
	function CompareProps(oldProps: Array<ParsedBase> | undefined, newProps: Array<ParsedBase>, owner: ComponentChange) {
		if (oldProps) {
			oldProps.forEach(element => {
				let newElem = SpliceElement(element, newProps);
				if (newElem) {
					if (newElem.kind === element.kind) {
						switch (element.kind) {
							case ParsedKind.Value: {
								if ((<ParsedValue>element).value !== (<ParsedValue>newElem).value) {
									let newProp = new PropChange(element.name || '', ChangeState.modified);
									newProp.value = (<ParsedValue>newElem).value;
									owner.props.push(newProp);
								};
								break;
							}
							case ParsedKind.FormComponent: {
								//i think this code will run only in form 'Properties' property;
								let oldComp = <ParsedComponent>element;
								let newComp = <ParsedComponent>newElem;
								CompareComponents(oldComp.components, newComp.components, owner);
							}
						}
					}
					else
						throw new Error('element kind was changed');
					return;
				}
				//create deleting info if prop (or all props) doesn't exist
				else {
					let newProp = new PropChange(element.name || '', ChangeState.deleted)
					owner.props.push(newProp);
				}
			})
		}
		//We can (should?) be sure, that all rest props in array was created by last changes
		newProps.forEach(elem => {
			switch (elem.kind) {
				case ParsedKind.Value: {
					let newProp = new PropChange(elem.name || '', ChangeState.created);
					newProp.value = (<ParsedValue>elem).value;
					owner.props.push(newProp);
				}
			}
		})
	}

	function CompareArgs(oldArgs: Array<ParsedBase> | undefined, newArgs: Array<ParsedBase>, owner: CallChange) {
		let newLength = newArgs.length;
		let oldLength = 0;
		if (oldArgs) {
			oldLength = oldArgs.length;
			for (let i = 0; i < oldLength; i++) {
				let oldArg = oldArgs[i];
				if (i < newLength) {
					let newArg = newArgs[i];
					if (oldArg.kind === newArg.kind)
						switch (oldArg.kind) {
							case ParsedKind.Value: {
								let arg = new PropChange(oldArg.name || '');
								if ((<ParsedValue>oldArg).value !== (<ParsedValue>newArg).value) {
									arg.state = ChangeState.modified;
								}
								arg.value = (<ParsedValue>newArg).value;
								owner.args.push(arg);
								break;
							}
						}
					else
						throw new Error(`CompareArgs: args have different kind`);
				}
				else {
					switch (oldArg.kind) {
						case ParsedKind.Value: {
							let newArg = new PropChange(oldArg.name || '', ChangeState.deleted);
							owner.args.push(newArg);
							break;
						}
					}
				}
			}
		}
		for (let j = oldLength; j < newLength; j++) {
			let newArg = newArgs[j];
			switch (newArg.kind) {
				case ParsedKind.Value: {
					let arg = new PropChange(<any>newArg.name, ChangeState.created);
					arg.value = (<ParsedValue>newArg).value;
					owner.args.push(arg)
				}
			}
		}
	}

	function CompareCalls(oldCalls: Array<ParsedFunction> | undefined, newCalls: Array<ParsedFunction>, owner: ComponentChange) {
		if (oldCalls) {
			oldCalls.forEach(oldCall => {
				let newCall = <ParsedFunction>SpliceElement(oldCall, newCalls);
				if (newCall) {
					let call = new CallChange(oldCall.name || '', ChangeState.modified);
					CompareArgs(oldCall.args, newCall.args, call);
					if (call.Changed()) {
						owner.calls.push(call);
					}
				}
			})
		}
		newCalls.forEach(newCall =>{
			let call = new CallChange(newCall.name || '', ChangeState.created);
			CompareArgs(undefined, newCall.args, call);
			owner.calls.push(call);
		})
	}

	function CompareComponents(oldComps: Array<ParsedComponent> | undefined, newComps: Array<ParsedComponent>, owner: ComponentChange) {
		if (oldComps) {
			oldComps.forEach(elem => {
				let newElem = <ParsedComponent>SpliceElement(elem, newComps);
				if (newElem) {
					let newComp = new ComponentChange(elem.name);
					CompareProps(elem.props, newElem.props, newComp);
					CompareCalls(elem.calls, newElem.calls, newComp);
					CompareComponents(elem.components, newElem.components, newComp);
					if (!newComp.Empty()) {
						newComp.state = ChangeState.modified;
						owner.components.push(newComp);
					}
				}
				else {
					let newComp = new ComponentChange(elem.name || '', ChangeState.deleted)
					owner.components.push(newComp);
				}
			})
		}
		//We should (can?) be sure, that all rest props in array was created by last changes
		newComps.forEach(elem => {
			let newComp = new ComponentChange(elem.name || '', ChangeState.created);
			CompareComponents(undefined, elem.components, newComp);
			CompareCalls(undefined, elem.calls, newComp);
			CompareProps(undefined, elem.props, newComp);
			if (!newComp.Empty()) {
				owner.components.push(newComp);
			}
		})
	}

	export function CompareForms(oldForm: ParsedForm, newForm: ParsedForm,
		errorLogger: (msg: string) => void): FormChange | undefined {

		try {
			if (oldForm.name !== newForm.name)
				return undefined;
			let result = new FormChange(newForm.name, ChangeState.modified);
			CompareProps(oldForm.props, newForm.props, result);
			CompareComponents(oldForm.components, newForm.components, result);
			if (!result.Empty()) {
				return result;
			}
		}
		catch (e) {
			errorLogger(e.stack)
		}
		return undefined;
	}
}