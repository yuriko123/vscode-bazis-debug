/**
 *
 */
declare interface ModelTransformer {
    /**
     * Применить изменения
     */
    Apply(undo: Undo3D);
    /**
     * Экспериментальная версия класса
     */
    TestVersion(): number;
    /**
     * Добавить изменение толщины панели
     * @param panel Изменяемая панель
     * @param thicknessDifference Разница между новой и старой толщинами
     */
    AddPanelThicknessChange(panel: Panel, thicknessDifference: number);
    /**
     * Вычислить все объекты рядом с панелью
     * @param auto Автоматически определить направление изменения толщины
     */
    Compute(auto: boolean);
    /**
     * Очистить всю информацию обо всех панелях
     */
    ClearChangesInfo(): void;

}

declare function NewModelTransformer(): ModelTransformer;

/**
 *
 */
declare interface ValueEditor {
    Value: number;
    Visible: boolean;
    Readonly: boolean;
    Position: Point;
}

interface Action3D {
    /**
     * Обработчик изменения ValueEditor
     */
    OnValueChange: Function;
    OnDraw: Function;
    ValueEditor: ValueEditor;
    /**
     * Возвращает ребро, на которое указывает курсор мыши;
     */
    Edge: Edge3;
    MousePos: Point2;
}

declare function NewValueEditor(value?: number): ValueEditor;

declare interface JointInfo {
    Object1: Object3,
    Object2: Object3,
    JointType: number,
    DrawLines(): void;
    SetEdgesOwner(newOwner: List3D): void;
}


declare interface ConnectionsInfo {
    Joints: Array<JointInfo>,
    JointCount: number,
    Created: boolean
}

declare function NewJointInfo(Obj1: Object3, Obj2: Object3): ConnectionsInfo;

declare interface AdvancedJoint {
    /**
     * информация о стыке
     */
    readonly Info: JointInfo,
    /**
     * Схема крепежа
     */
    Scheme: ParamFastener,
    /**
     * Блок крепежа, установленного по схеме
     */
    readonly JointBlock: Block,
    /**
     * Выбрать ребро для монтирования
     */
    SelectEdge(edge: Edge3): boolean,
    /**
     * Изменить направление монтирования
     */
    RevertEdgeDirection(edge: Edge3): boolean,
    /**
     * Смонтировать схему на стык
     * @param TempScheme схема крепежа. По умолчанию this.Scheme
     */
    Mount(TempScheme?): boolean;
}

interface Model3D{
    DS: Designer;
}

declare function NewAdvancedJoint(Info: JointInfo): AdvancedJoint;

declare interface FurnitureInfo {
    Params: ParamFastener;
}

declare interface ParamFastener {
    /**
     * способ базирования крепежа
     */
    DatumMode;
    Name: string;
    Thickness1: number;
    Thickness2: number;
    IsValid(): boolean;
}

interface InFurniture{
    FurnInfo: InfFurniture;
}

interface InfFurniture{

    GetInfo(): FurnitureInfo;

}

declare interface Designer{
    Render: Renderer;
    FindEdge(Root: Object3, CursorPos: Point2, SearchDistance: number): Edge3; overload;
}

declare interface Renderer{

}

declare interface Point2{
    X: number;
    Y: number;
}