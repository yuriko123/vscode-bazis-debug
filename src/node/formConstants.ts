export namespace bzConsts {

	export let Constructors = {
		NewForm : 'NewForm',
		NewButton :'NewButton',
		NewNumber : 'NewNumber',
		NewBool: 'NewBool',
		NewString: 'NewString',
		NewCombo: 'NewCombo',
		NewGroup: 'NewGroup',
		NewImage: 'NewImage',
		NewSelector: 'NewSelector',
		NewMaterial: 'NewMaterial',
		NewButt: 'NewButt',
		NewFurniture: 'NewFurniture',
		NewLabel: 'NewLabel',
		NewColor: 'NewColor',
		NewSeparator: 'NewSeparator'
	};

	export class Layout{
		left: number;
		top: number;
		width: number;
		height: number;
	}

	export function NewDeclaration(name: string, type:string,  caption?: string, l?: Layout): string{
		let result = `let ${name} = ${type}(${caption? caption : ''});\n`;
		if (type != Constructors.NewForm && l)
			result += `${name}. SetLayout(${l.left}, ${l.top}, ${l.width}, ${l.height});\n`;
		return result;
	}
}