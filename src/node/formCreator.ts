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
		pos: number;
		end: number;
	}

	let nullRange: Range = { pos: -1, end: -1 };

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
			super({ pos: -1, end: -1 }, name);
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
			// for (let i = 0; i < this.calls.length; i ++){
			// 	let call = this.calls[i]
			// 	if (call.name === fullname[0]) {
			// 		// if (fullname.length > 1) {
			// 		// 	fullname.splice(0, 1);
			// 		// 	call.FindReference(fullname, cb);
			// 		// }
			// 		if (cb)
			// 			cb(call);
			// 	}
			// }
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
			let dropDown = new ParsedObject(nullRange, 'DropDownMenu');
			dropDown.kind = ParsedKind.FormComponent;
			this.props.push(dropDown);
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
			AddVariable(new ParsedComponent(nullRange, 'Properties', ''), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'OKButton', 'false'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'OKButtonCaption', 'ОК'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'CancelButton', 'false'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'CancelButtonCaption', 'Отмена'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'MinHeight', '200'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'MinWidth', '200'), this.props, this);
			AddVariable(new ParsedValue(nullRange, 'Caption', ''), this.props, this);
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
						args.push(new ParsedValue(nullRange, '', undefined));
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
				args.push(new ParsedValue(nullRange, '', undefined));
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
}