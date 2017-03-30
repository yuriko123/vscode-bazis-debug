/**
 *
 */
declare interface ModelTransformer{
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
    ClearChangesInfo();

}

declare function NewModelTransformer(): ModelTransformer;

/**
 *
 */
declare class ValueEditor{
    Value: number;
    Visible: boolean;
    Readonly: boolean;
    Position: Point;
}

interface Action3D{
    /**
     * Обработчик изменения ValueEditor
     */
    OnValueChange: Function;
}

declare function NewValueEditor(value?: number): ValueEditor;