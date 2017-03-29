
declare interface System {
    /**
     * Вывести диагностическое сообщение (для отладки?)
     * @param str сообщение 
     */
    log(str: string);
    /**
     * Подключить указанный файл
     */
    include(filename: string);
    /** 
     * Возвращает true, если файл существует
     * @deprecated используйте fs.existsSync
     * @param filename путь к файлу
     */
    fileExists(filename: string): boolean;
    /**
     * Открыть диалог выбора файла
     * @param extension расширение файла
     */
    askFileName(extension: string): string;
    /**
     * Записать текст в файл
     * @deprecated используйте fs.writeFileSync
     * @param filename путь к файлу
     * @param  content содержимое файла
     */
    writeTextFile(filename: string, content: string);
    /**
     * Записать текст в файл с запросом имени файла
     * @param extension Расширение файла
     * @param  content содержимое
     */
    askWriteTextFile(extension: string, content: string);
    /**
     * Считать текст из файла
     * @param filename Имя файла
     */
    readTextFile(filename: string): string;
    /**
     * Считать текст из файла с запросом выбора файла
     * @param extension Расширение файла
     */
    askReadTextFile(extension: string): string;
    /**
     * Выполнить зашифрованный код
     * @param str код скрипта
     */
    secureExec(str: string);
    /**
     * Выполнить внешнюю программу
     * @param str код программы
     */
    exec(str: string): boolean;
    /**
     * Задерживает выполнение программы на указанное время
     * @param ms время (в миллисекундах)
     */
    sleep(ms: number);
    /**
     * Текущая версия Bazis API
     */
    apiVersion: number;

}

declare interface IDispatch {
    /**
     * Информациях о методах и свойствах объекта
     */
    GetTypeInfo: string;

}

/*declare interface ProjectFile{
    Items: Array<ProjectFile>;
    Count: number;
    Name: string;
    FullName: string;
    IsFileProject: boolean;
}*/

declare interface Model3D extends List3D {
    /**
     * Размер модели
     */
    GSize: Vector;
    /**
     * Габарит модели
     */
    GMin: Vector;
    /**
     * Габарит модели
     */
    GMax: Vector;
    /**
     * Выделенный объект модели
     */
    Selected: Object3; 
    /**
     * Количество выделенных элементов
     */
    SelectionCount: number;
    /**
     * Список выделенных элементов
     */
    Selections: Array<Object3>;
    /**
     * Количество объектов в модели
     */
    Count: number;
    /**
     * Список объектов модели
     */
    Objects: Array<Object3>;

}

declare interface Action3D{
    /**
     * Если false, то запрещены любые функции взаимодействия с пользователем
     */
    Interactive: boolean;
    /**
     * Продолжить вызывать прерывания по завершению основного тела скрипта, не завершая команды
     */
    Continue();
    /**
     * Применить изменения в модели внесенные в скрипте
     */
    Commit();
    /**
     * Завершить команду
     */
    Finish();
    /**
     * Отменить команду
     */
    Cancel();
    /**
     * Выполнить функцию, в которой доступны запросы Get*
     * @param func функция для выполнения
     */
    AsyncExec(func: Function);
    /**
     * Позиция курсора
     */
    MouseX: number;
    /**
     * Позиция курсора
     */
    MouseY: number;
    /**
     * Текущая позиция маркера
     */
    Pos3: Vector;
    /**
     * Нормаль к текущему виду
     */
    ViewDir: Vector;
    /**
     * Вектор вверх текущего вида
     */
    UpDir: Vector;
    /**
     * Вектор вправо текущего вида
     */
    RightDir: Vector;
    /**
     * Разрешать подсвечивать точки
     */
    ShowPoints: boolean;
    /**
     * Разрешать подсвечивать ребра
     */
    ShowEdges: boolean;
    /**
     * Установить строку подсказки
     */
    Hint: string;
    /**
     * Установить сообщение об ошибке
     */
    ErrorHint: string;
    /**
     * Установить мигающую подсказку
     */
    BlinkHint: string;
    /**
     * Включить режим Орто относительно точки
     * @param pos Координаты точки
     */
    BeginOrtho3(pos: Vector);
    /**
     * Отключить режим Орто
     */
    EndOrtho3();
    /**
     * Сдвинуть курсор к ближайшей точке привязки
     */
    CursorToClosestPoint();
    /**
     * Сдвинуть курсор к ближайшей линии
     */
    CursorToClosestLine();
    /**
     * Сдвинуть курсор к ближайшей середине линии
     */
    CursorToMiddleOfLine();
    /**
     * Найти точку на модели в текущем положении курсора мыши
     */
    Find3DPoint(): Vector;
    /**
     * Найти точку на плоскости X0Z
     */
    Find3DPointXZPlane(): Vector;
    /**
     * Найти объект под курсором мыши
     */
    Get3DObject(): Object3;
    /**
     * Обработчик щелчка мыши
     */
    OnClick: Function;
    /**
     * Обработчик щелчка мыши
     */
    OnMove: Function;
    /**
     * Обработчик начала работы скрипта. Вызывается после загрузки значений свойств
     */
    OnStart: Function;
    /**
     * Обработчик завершения работы скрипта
     */
    OnFinish: Function;
    /**
     * Запустить тонирование изображения
     */
    RayTraceScene();
    /**
     * Обработчик завершения работы скрипта
     */
    OnRayTraceFinished: Function;
    /**
     * Набор редактируемых свойств
     */
    Properties: ScriptProperty;
    /**
     * Загрузить модель из файла
     */
    LoadModel(filename: string): boolean;
    /**
     * Сохранить модель в файл
     */
    SaveModel(filename: string);
    /**
     * Загрузить проект из файла
     */
    //LoadProject(filename: string): ProjectFile;
    /**
     * Сохранить проект в файл
     */
    //SaveProject(filename: string, project: ProjectFile);
}

declare interface ScriptMenu{
    /**
     * Имя свойства
     */
    Name: string;
    /**
     * Обработчик изменения свойства и вложенных свойств
     */
    OnChange: Function;
    /**
     * Количество вложенных свойств
     */
    Count: number;
    /**
     * Список вложенных свойств
     */
    Items: Array<ScriptProperty>;
    /**
     * Очистить вложенные свойства
     */
    Clear();
    /**
     * Флаг, сохраняется ли свойство в файл
     */
    Store: boolean;
    /**
     * Сохранить введенные пользователем данные в файле xml
     * @param filename 
     */
    Save(filename: string);
    /**
     * Загрузить значения полей из файла xml
     * @param filename
     */
    Load(filename: string): boolean;
    /**
     * Создать вложенную группу свойств
     * @param caption Название группы
     */
    NewGroup(caption: string): ScriptGroupProperty;
    /**
     * Создать строковое свойство
     * @param caption Название свойства
     */
    NewString(caption: string): ScriptStringProperty;
    /**
     * Создать свойство вида Да/Нет
     * @param caption Название свойства
     */
    NewBool(caption: string): ScriptBooleanProperty;
    /**
     * Создать числовое свойство
     * @param caption Название свойства
     */
    NewNumber(caption: string): ScriptNumberProperty;
    /**
     * Создать кнопку
     * @param caption Название свойства
     */
    NewButton(caption: string): ScriptButtonProperty;

}

declare interface PropertyLayout{
    /**
     * Левая граница
     */
    Left: number;
    /**
     * Правая граница
     */
    Right: number;
    /**
     * Верхняя граница
     */
    Top: number;
    /**
     * Нижняя граница
     */
    Bottom: number;
    /**
     * Ширина свойства
     */
    Width: number;
    /**
     * Высота свойства
     */
    Height: number;

}

declare interface ScriptProperty{
    /**
     * Имя свойства
     */
    Name: string;
    /**
     * Родительское свойство
     */
    Owner: ScriptProperty;
    /**
     * Разрешить редактирование имени (для создания таблиц)
     */
    NameEditable: boolean;
    /**
     * Возможность выделение свойства пользователем
     */
    Enabled: boolean;
    /**
     * Выделение вложенных свойств
     */
    ChildrenEnabled: boolean;
    /**
     * Видимость свойства в окне свойств
     */
    Visible: boolean;
    /**
     * Развернуты ли вложенные свойства
     */
    Expanded: boolean;
    /**
     * Обработчик изменения свойства и вложенных свойств
     */
    OnChange: Function;
    /**
     * Обработчик изменения свойства
     */
    OnValueChange: Function;
    /**
     * Обработчик активации свойства или меню
     */
    OnActivate: Function;
    /**
     * Обработчик деактивации свойства или меню
     */
    OnDeactivate: Function;
    /**
     * Цвет фона
     */
    BackColor: number;
    /**
     * Пользовательское число
     */
    Tag: number;
    /**
     * Количество вложенных свойств
     */
    Count: number;
    /**
     * Список вложенных свойств
     */
    Items: Array<ScriptProperty>;
    /**
     * Очистить вложенные свойства
     */
    Clear();
    /**
     * Флаг, сохраняется ли свойство в файл
     */
    Store: boolean;
    /**
     * Сохранить введенные пользователем данные в файле xml
     * @param filename
     */
    Save(filename: string);
    /**
     * Загрузить значения полей из файла xml
     * @param filename
     */
    Load(filename: string): boolean;
    /**
     * Проверка корректности значения
     */
    OnValueValidate: Function;
    /**
     * Флаг корректности введенного значения, выставляется пользовательским обработчиком
     */
    ValueValid: boolean;
    /**
     * Проверить значение свойства и вложенных свойств
     */
    Validate(): boolean;
    /**
     * Расположение свойства на форме
     */
    Layout: PropertyLayout;
    /**
     * Задать расположение свойства на форме
     * @param  L Отступ от левого края родительского объекта
     * @param  T Отступ от верхнего края родительского объекта
     * @param  W Ширина 
     * @param  H Высота 
     */
    SetLayout(L: number, T: number, W: number, H: number);
    /**
     * Задать выравнивание компонента
     */
    Align: AlignType;
    /**
     * Выравнивать с отступами
     */
    AlignWithMargins: boolean;
    /**
     * Отступы между компонентами 
     * @param  L Отступ слева
     * @param  R Отступ справа
     * @param  T Отступ сверху
     * @param  B Отступ снизу
     */
    SetMargins(L: number, R: number, T: number, B: number);
    /**
     * Выравнивание текста в надписи
     */
    Alignment: AlignmentType;
    /**
     * Создать вложенную группу свойств
     * @param caption Название группы
     */
    NewGroup(caption: string): ScriptGroupProperty;
    /**
     * Создать вложенную группу свойств c рисунком
     * @param caption Название свойства
     * @param imagefile путь к файлу с рисунком
     */
    NewImage(caption: string, imagefile: string): ScriptGroupProperty;
    /**
     * Создать строковое свойство
     * @param caption Название свойства
     */
    NewString(caption: string): ScriptStringProperty;
    /**
     * Создать свойство вида Да/Нет
     * @param caption Название свойства
     */
    NewBool(caption: string): ScriptBooleanProperty;
    /**
     * Создать числовое свойство
     * @param caption Название свойства
     */
    NewNumber(caption: string): ScriptNumberProperty;
    /**
     * Создать кнопку
     * @param caption Название свойства
     */
    NewButton(caption: string): ScriptButtonProperty;
    /**
     * Создать свойство с кнопкой редактирования
     * @param caption Название свойства
     */
    NewSelector(caption: string): ScriptSelectorProperty;
    /**
     * Создать свойство - выпадающий список
     * @param caption Название свойства
     * @param  Item1 Первый элемент списка
     */
    NewCombo(caption: string, Item1?: string): ScriptComboProperty;
    /**
     * Создать свойство типа материал
     * @param caption Название свойства
     */
    NewMaterial(caption: string): ScriptMaterialProperty;
    /**
     * Создать свойство типа материал
     * @param caption Название свойства
     */
    NewButt(caption: string): ScriptButtProperty;
    /**
     * Создать свойство типа материал
     * @param caption Название свойства
     */
    NewFurniture(caption: string): ScriptFurnitureProperty;
    /**
     * Создать свойство типа цвет
     * @param caption Название свойства
     */
    NewColor(caption: string): ScriptColorProperty;
    /**
     * Создать разделитель
     */
    NewSeparator: ScriptProperty;
    /**
     * Создать надпись
     * @param caption Название свойства
     */
    NewLabel(caption: string): ScriptProperty;
    /**
     * Всплывающее меню
     */
    PopupMenu: ScriptMenu;
    /**
     * Выпадающее меню
     */
    DropDownMenu: ScriptMenu;

}

/**
 * Тип выравнивания текста на надписи
 */
declare enum AlignmentType {
    /**
     * Выравнивание по левому краю
     */
    Left,
    /**
     * Выравнивание по правому краю
     */
    Right,
    /**
     * Выравнивание по центру
     */
    Center

}

/**
 * Типы выравнивания компонентов на форме
 */
declare enum AlignType {
    /**
     * Не выравнивается по форме
     */
    None,
    /**
     * Выравнивается по верхнему краю
     */
    Top,
    /**
     * Выравнивается по нижнему краю
     */
    Bottom,
    /**
     * Выравнивается по левому краю
     */
    Left,
    /**
     * Выравнивается по правому краю
     */
    Right,
    /**
     * Выравнивается по всей площади родительского компонента
     */
    Client

}

/**
 * Позиция немодального окна
 */
declare enum WindowPosition {
    /**
     * Стандартная позиция формы
     */
    Default,
    /**
     * Форма пристыковывается слева
     */
    Left,
    /**
     * Форма пристыковывается справа
     */
    Right

}

/**
 * Позиция фурнитуры при установке крепежа
 */
// declare enum FurniturePosition {
//     /**
//      * Установка фурнитуры внутри стыка
//      */
//     Inside,
//     /**
//      * Установка фурнитуры снаружи стыка
//      */
//     Outside,
//     /**
//      * Установка фурнитуры вверху стыка (только для стыков с горизонтальной панелью)
//      */
//     Up,
//     /**
//      * Установка фурнитуры внизу стыка (только для стыков с горизонтальной панелью)
//      */
//     Down

// }


/**
 * Тип ошибки анализа модели
 */
declare enum ErrorType {
    /**
     * Пересечение объектов
     */
    ObjIntersection,
    /**
     * Пересечение фурнитуры
     */
    FastIntersection,
    /**
     * Неправильная установка фурнитуры
     */
    FastIncorrect,
    /**
     * Материала нет в наличии
     */
    MatNotExists,
    /**
     * Материал отсутствует на складе
     */
    MatOutOfStock,
    /**
     * Панель невозможно разместить на плите
     */
    PanelTooLarge,
    /**
     * Пластик невозможно разместить на панели
     */
    PlasticTooLarge,
    /**
     * Панель не закреплена
     */
    PanelNotFixed

}

declare interface InspectorError{
    /**
     * Тип ошибки
     */
    ErrorType: ErrorType;
    /**
     * Количество объектов в ошибке
     */
    ErrorObjectsCount: number;
    /**
     * Список объектов, относящихся к ошибке
     */
    ErrorObjects: Array<Object3>;
    /**
     * Сообщение ошибки
     */
    ErrorMessage: string;
    /**
     * Имена объектов в ошибке
     */
    ObjectsNames: string;

}

declare interface InspectorOptions{
    /**
     * Проверка пересечения объектов
     */
    ObjIntersectionAnalyze: boolean;
    /**
     * Проверка пересечения фурнитуры
     */
    FastIntersectionAnalyze: boolean;
    /**
     * Проверка корректности фурнитуры
     */
    FastIncorrectAnalyze: boolean;
    /**
     * Проверка скрепления панелей
     */
    PanelNotFixedAnalyze: boolean;
    /**
     * Проверка размера панели на плите
     */
    PanelTooLargeAnalyze: boolean;
    /**
     * Проверка размера пластика на плите
     */
    PlasticTooLargeAnalyze: boolean;
    /**
     * Проверка материала в наличии
     */
    MatNotExistsAnalyze: boolean;
    /**
     * Проверка материала на складе
     */
    MatOutOfStockAnalyze: boolean;

}

declare interface ModelInspector{
    /**
     * Проверить модель
     * @param Model
     */
    Run(Model: List3D);
    /**
     * Список ошибок
     */
    ErrorList: Array<InspectorError>;
    /**
     * Опции анализа
     */
    Options: InspectorOptions;

}

declare interface ScriptForm{
    /**
     * Набор редактируемых свойств
     */
    Properties: ScriptProperty;
    /**
     * Показать форму
     * @param WindowPos
     */
    Show(WindowPos?: WindowPosition);
    /**
     * Показать модальную форму
     */
    ShowModal(): boolean;
    /**
     * Заголовок формы
     */
    Caption: string;
    /**
     * Ширина формы
     */
    Width: number;
    /**
     * Высота формы
     */
    Height: number;
    /**
     * Минимальная ширина формы
     */
    MinWidth: number;
    /**
     * Минимальная высота формы
     */
    MinHeight: number;
    /**
     * Видимость формы
     */
    Visible: boolean;
    /**
     * Положение левого края формы
     */
    Left: number;
    /**
     * Положение верхнего края формы
     */
    Top: number;
    /**
     * Показывать кнопку "ОК" на форме
     */
    OKButton: boolean;
    /**
     * Текст кнопки "ОК"
     */
    OKButtonCaption: string;
    /**
     * Показывать кнопку "Отмена" на форме
     */
    CancelButton: boolean;
    /**
     * Текст кнопки "Отмена"
     */
    CancelButtonCaption: string;
    /**
     * Обработчик закрытия формы
     */
    OnClose: Function;
    /**
     * Закрыть форму
     */
    Close();
    /**
     * Обработчик открытия формы
     */
    OnShow: Function;
    /**
     * Возможность изменять размеры формы
     */
    Resizable: boolean;
    /**
     * Возможность пристыковывать не модальную форму
     */
    Dockable: boolean;
    /**
     * Обработчик нажатия на кнопку OK
     */
    OnOkButtonClick: Function;
    /**
     * Обработчик нажатия на кнопку Cancel
     */
    OnCancelButtonClick: Function;

}

declare interface ScriptParamFastenerDB{
    /**
     * Загрузить базу из файла
     * @param  filename
     */
    LoadFromFile(filename: string): string;
    /**
     * Добавить базу из файла
     * @param  filename
     */
    AddFromFile(filename: string): string;
    /**
     * Сохранить базу в файл
     * @param  filename
     */
    SaveToFile(filename: string): string;

}

declare interface ScriptGroupProperty extends ScriptProperty {
    /**
     * 
     */
    Image: string;
    /**
     * 
     */
    MaxHeight: number;

}

declare interface ScriptStringProperty extends ScriptProperty{
    /**
     * 
     */
    Value: string;

}

declare interface ScriptBooleanProperty extends ScriptProperty{
    /**
     * 
     */
    Value: boolean;

}

declare interface ScriptNumberProperty extends ScriptProperty{
    /**
     * 
     */
    MinValue: number;
    /**
     * 
     */
    MaxValue: number;
    /**
     * 
     */
    Value: number;
    /**
     * 
     */
    ValueStep: number;

}

declare interface ScriptButtonProperty extends ScriptProperty{
    /**
     * Обработчик нажатия на кнопку
     */
    OnClick: Function;

}

declare interface ScriptSelectorProperty extends ScriptProperty{
    /**
     * 
     */
    Value: string;
    /**
     * Обработчик нажатия на кнопку редактирования свойства
     */
    OnClick: Function;

}

declare interface ScriptComboProperty extends ScriptProperty{
    /**
     * 
     */
    ItemIndex: number;
    /**
     * Добавить элемент в список
     * @param item
     */
    AddItem(item: string);
    /**
     * 
     */
    Value: string;

}

declare interface ScriptMaterialProperty extends ScriptProperty{
    /**
     * 
     */
    Thickness: number;
    /**
     * 
     */
    Width: number;
    /**
     * Установить активным. Все последующие элементы будут построены из этого материала
     */
    SetActive();

}

declare interface ScriptButtProperty extends ScriptProperty{
    /**
     * Толщина кромки
     */
    Thickness: number;
    /**
     * Ширина ленты
     */
    Width: number;
    /**
     * Установить активным. Все последующие элементы будут построены из этого материала
     */
    SetActive();

}

declare interface ScriptFurnitureProperty extends ScriptProperty{
    /**
     * 
     */
    Value: InfFurniture;

}

declare interface ScriptColorProperty extends ScriptProperty{
    /**
     * 
     */
    Value: number;

}

declare interface Undo3D{
    /**
     * 
     * @param obj
     */
    Changing(obj: Object3);
    /**
     * 
     * @param obj
     */
    RecursiveChanging(obj: Object3);

}

declare interface FurnMaterial{
    /**
     * 
     */
    Name: string;
    /**
     * 
     */
    Thickness: number;
    /**
     * 
     */
    Width: number;
    /**
     * Создать материал из наименования и толщины (ширины)
     * @param name
     * @param thick
     */
    Make(name: string, thick: number);

}

declare interface Vector{
    /**
     * 
     */
    x: number;
    /**
     * 
     */
    y: number;
    /**
     * 
     */
    z: number;

}

declare interface Point{
    /**
     * 
     */
    x: number;
    /**
     * 
     */
    y: number;

}

declare interface Edge3{
    /**
     * Начало ребра в ЛСК
     */
    First: Vector;
    /**
     * Конец ребра в ЛСК
     */
    Last: Vector;
    /**
     * Начало ребра
     */
    GFirst: Vector;
    /**
     * Конец ребра
     */
    GLast: Vector;

}

declare interface Object3 extends Object{
    /**
     * Наименование
     */
    Name: string;
    /**
     * Артикул
     */
    ArtPos: string;
    /**
     * Родитель объекта
     */
    Owner: List3D;
    /**
     * Видимость объекта
     */
    Visible: boolean;
    /**
     * Является ли объект выделенным
     */
    Selected: boolean;
    /**
     * Цвет линий объекта
     */
    Color: number;
    /**
     * Является ли объект структурным
     */
    List: boolean;
    /**
     * Привести объект к структурному
     */
    AsList: List3D;
    /**
     * Привести объект к типу панели
     */
    AsPanel: Panel;
    /**
     * Положение объекта
     */
    Position: Vector;
    /**
     * Координата x
     */
    PositionX: number;
    /**
     * Координата y
     */
    PositionY: number;
    /**
     * Координата z
     */
    PositionZ: number;
    /**
     * Установить нулевые положение и ориентацию объекта
     */
    SetDefaultTransform();
    /**
     * Сместить объект
     * @param dir Вектор смещения
     */
    Translate(dir: Vector);
    /**
     * Повернуть вокруг заданной оси
     * @param axis 
     * @param angle Угол (в градусах)
     */
    Rotate(axis: Vector, angle: number);
    /**
     * 
     * @param dir Вектор смещения
     */
    TranslateGCS(dir: Vector);
    /**
     * 
     * @param axis
     * @param angle Угол (в градусах)
     */
    RotateGCS(axis: Vector, angle: number);
    /**
     * Повернуть вокруг оси X
     * @param angle Угол (в градусах)
     */
    RotateX(angle: number);
    /**
     * Повернуть вокруг оси Y
     * @param angle Угол (в градусах)
     */
    RotateY(angle: number);
    /**
     * Повернуть вокруг оси Z
     * @param angle Угол (в градусах)
     */
    RotateZ(angle: number);
    /**
     * Развернуть объект вдоль осей
     * @param axisz
     * @param axisy
     */
    Orient(axisz: Vector, axisy: Vector);
    /**
     * 
     * @param axisz
     * @param axisy
     */
    OrientGCS(axisz: Vector, axisy: Vector);
    /**
     * Преобразовать точку в ЛСК объекта
     * @param pos
     */
    ToObject(pos: Vector): Vector;
    /**
     * Преобразовать точку из ЛСК объекта
     * @param pos
     */
    ToGlobal(pos: Vector): Vector;
    /**
     * Преобразовать нормаль в ЛСК объекта
     * @param dir
     */
    NToObject(dir: Vector): Vector;
    /**
     * Преобразовать нормаль из ЛСК объекта
     * @param dir
     */
    NToGlobal(dir: Vector): Vector;
    /**
     * Локальные размеры объекта
     */
    GSize: Vector;
    /**
     * Габарит объекта в ЛСК
     */
    GMin: Vector;
    /**
     * Габарит объекта в ЛСК
     */
    GMax: Vector;
    /**
     * Габарит объекта
     */
    GabMin: Vector;
    /**
     * Габарит объекта
     */
    GabMax: Vector;
    /**
     * Получить список общего крепежа на двух панелях
     * @param Obj
     */
    FindConnectedFasteners(Obj?: Object3): Array<Object3>;
    /**
     * Получить список объектов, соединяемых этим крепежом
     */
    FindFastenedObjects(): Array<Object3>;
    /**
     * Количество пользовательских свойств
     */
    UserPropCount: number;
    /**
     * Значения свойства по его имени или индексу
     */
    UserProperty: Array<Object>;
    /**
     * Названия свойств
     */
    UserPropertyName: Array<string>;
    /**
     * Перестроить объект после изменения его свойств
     */
    Build();

}

declare interface List3D extends Object3{
    /**
     * Количество объектов в структуре
     */
    Count: number;
    /**
     * Список объектов
     */
    Objects: Array<Object3>;
    /**
     * Найти объект по имени
     * @param name
     */
    Find(name: string): Object3;
    /**
     * Являетсяли объект эластичным
     */
    IsElastic(): boolean;
    /**
     * Растянуть объект до требуемых размеров
     * @param newSize
     */
    ElasticResize(newSize: Vector): Vector;
    /**
     * Загрузить объекты из файлов *.b3d,*.f3d
     * @param file
     */
    Load(file: string): boolean;

}

declare interface Panel extends Object3{
    /**
     * Контур панели
     */
    Contour: Contour2D;
    /**
     * Ширина контура панели
     */
    ContourWidth: number;
    /**
     * Высота контура панели
     */
    ContourHeight: number;
    /**
     * Толщина панели
     */
    Thickness: number;
    /**
     * Материал панели
     */
    MaterialName: string;
    /**
     * Ширина материала
     */
    MaterialWidth: number;
    /**
     * Ориентация текстуры
     */
    TextureOrientation: TextureOrientation;
    /**
     * Список кромок
     */
    Butts: PanelButts;
    /**
     * Список пластиков
     */
    Plastics: PanelPlastics;
    /**
     * Список пазов
     */
    Cuts: PanelCuts;
    /**
     * Закрыта ли кромка другими панелями? Указывается индекс кромки и расстояние до панелей.
     * @param index индекс кромки
     * @param distance расстояние до панелей
     */
    IsButtVisible(index: number, distance: number): boolean;
    /**
     * Является ли контур прямоугольным?
     */
    IsContourRectangle: boolean;
    /**
     * Накатать кромку на элемент
     * @param material
     * @param elem 
     */
    AddButt(material, elem): PanelButt;
    /**
     * Наклеить пластик на панель
     * @param material
     * @param Front На лицевую пласть панели
     */
    AddPlastic(material: InMaterial, Front: boolean): PanelPlastic;
    /**
     * Создать новый паз
     * @param name
     */
    AddCut(name: string): PanelCut;

}

declare interface Extrusion extends Object3{
    /**
     * Контур профиля
     */
    Contour: Contour2D;
    /**
     * Длина профиля
     */
    Thickness: number;
    /**
     * Материал
     */
    MaterialName: string;
    /**
     * Ширина материала
     */
    MaterialWidth: number;
    /**
     * Отрезать часть профиля в точке pos перпендикулярно normal
     * @param pos
     * @param normal
     */
    Clip(pos: Vector, normal: Vector);

}

declare interface Trajectory extends Object3{
    /**
     * 
     */
    Contour2D: Contour2D;
    /**
     * 
     */
    Trajectory2D: Contour2D;
    /**
     * 
     */
    MaterialName: string;
    /**
     * Ширина материала
     */
    MaterialWidth: number;

}

declare interface Block extends List3D{
    /**
     * 
     */
    AnimType: AnimationType;
    /**
     * Флаг составной фурнитуры
     */
    IsFastener(): boolean;

}

declare interface Assembly extends List3D{
    /**
     * 
     */
    AnimType: AnimationType;

}

declare interface Contour3D extends Object3{
    /**
     * Элементы вспомогательного контура
     */
    Contour: Contour2D;

}

declare interface Size3D extends Object3{
    /**
     * Перестроить по точкам
     * @param Pos1
     * @param Pos2
     * @param TopPos
     */
    MakeOnPoints(Pos1, Pos2, TopPos);
    /**
     * Размер
     */
    Value: number;

}


/**
 * Типы анимации сборок и блоков
 */
declare enum AnimationType {
    /**
     * Не учитывается в салоне
     */
    None,
    /**
     * Учитывается в салоне, не имеет анимации
     */
    Custom,
    /**
     * Дверь левая
     */
    DoorLeft,
    /**
     * Дверь правая
     */
    DoorRight,
    /**
     * Дверь откидная
     */
    DoorFlap,
    /**
     * Дверь подъемная
     */
    DoorLift,
    /**
     * Дверь купе левая
     */
    SDoorLeft,
    /**
     * Дверь купе правая
     */
    SDoorRight,
    /**
     * Ящик
     */
    Box,
    /**
     * Опора
     */
    Support,
    /**
     * Ручка
     */
    Handle,
    /**
     * Фасад
     */
    Facade

}

/**
 * Направление текстуры материала на панели
 */
declare enum TextureOrientation {
    /**
     * Нет
     */
    None,
    /**
     * Горизонтально
     */
    Horizontal,
    /**
     * Вертикально
     */
    Vertical

}

declare interface PanelButts{
    /**
     * 
     */
    Add(): PanelButt;
    /**
     * 
     */
    Count: number;
    /**
     * 
     */
    Butts: Array<PanelButt>;

}

declare interface PanelButt{
    /**
     * 
     */
    ElemIndex: number;
    /**
     * 
     */
    Sign: string;
    /**
     * 
     */
    Material: string;
    /**
     * 
     */
    Thickness: number;

}

declare interface PanelPlastics{
    /**
     * 
     */
    Add(): PanelPlastic;
    /**
     * 
     */
    Count: number;
    /**
     * 
     */
    Plastics: Array<PanelPlastic>;

}

declare interface PanelPlastic{
    /**
     * 
     */
    Material: string;
    /**
     * 
     */
    Thickness: number;
    /**
     * 
     */
    TextureOrientation: TextureOrientation;

}

declare interface PanelCuts{
    /**
     * 
     */
    Add(): PanelCut;
    /**
     * 
     */
    Count: number;
    /**
     * 
     */
    Cuts: Array<PanelCut>;

}

declare interface PanelCut{
    /**
     * 
     */
    Name: string;
    /**
     * Условное обозначение
     */
    Sign: string;
    /**
     * Траектория паза
     */
    Trajectory: Contour2D;
    /**
     * Профиль паза
     */
    Contour: Contour2D;

}

declare interface Contour2D{
    /**
     * Количество элементов контура
     */
    Count: number;
    /**
     * Ширина контура
     */
    Width: number;
    /**
     * Высота контура
     */
    Height: number;
    /**
     * Левый нижний угол охватывающего прямоугольника
     */
    Min: Point;
    /**
     * Правый верхний угол охватывающего прямоугольника
     */
    Max: Point;
    /**
     * Очистить контур
     */
    Clear();
    /**
     * Сдвинуть все элементы
     * @param dx
     * @param dy
     */
    Move(dx: number, dy: number);
    /**
     * Повернуть вокруг точки
     * @param x
     * @param y
     * @param angle Угол (в градусах)
     */
    Rotate(x: number, y: number, angle: number);
    /**
     * Добавить прямоугольник
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    AddRectangle(x1: number, y1: number, x2: number, y2: number);
    /**
     * Добавить прямоугольник со скурглёнными краями
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param rad
     */
    AddRoundRect(x1: number, y1: number, x2: number, y2: number, rad: number);
    /**
     * Добавить линию
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    AddLine(x1: number, y1: number, x2: number, y2: number): Object;
    /**
     * Добавить окружность
     * @param xc
     * @param yc
     * @param rad
     */
    AddCircle(xc: number, yc: number, rad: number): Object;
    /**
     * Добавить дугу по началу, концу и центру
     * @param p1
     * @param p2
     * @param centre
     * @param orient Ориентация против часовой стрелки
     */
    AddArc(p1: Point, p2: Point, centre: Point, orient: boolean): Object;
    /**
     * Добавить дугу по 3 точкам
     * @param p1
     * @param p2
     * @param p3
     */
    AddArc3(p1: Point, p2: Point, p3: Point): Object;
    /**
     * Добавить эквидистанту контура. Последние 2 параметры отвечают за направление и скругление
     * @param contour 
     * @param offset
     * @param Side
     * @param Rounding
     * @param Pos 
     */
    AddEquidistant(contour: Contour2D, offset: number, Side: boolean, Rounding: boolean, Pos?: Point);
    /**
     * Вычесть замкнутый контур
     * @param contour
     */
    Subtraction(contour: Contour2D);
    /**
     * Сложить с замкнутым контуром
     * @param contour
     */
    Addition(contour: Contour2D);
    /**
     * Скругление элементов
     * @param elem1
     * @param elem2
     * @param x
     * @param y
     * @param radius
     */
    RoundingEx(elem1, elem2, x: number, y: number, radius): Object;
    /**
     * Фаска на 2 элементах
     * @param elem1
     * @param elem2
     * @param l1
     * @param l2
     */
    FacetEx(elem1, elem2, l1: number, l2?:number): Object;
    /**
     * Скругление в указанной точке
     * @param x
     * @param y
     * @param radius
     */
    Rounding(x: number, y: number, radius: number): Object;
    /**
     * Фаска в указанной точке
     * @param x
     * @param y
     * @param l
     */
    Facet(x: number, y: number, l: number): Object;
    /**
     * Найти ближайший элемент по координатам
     * @param x
     * @param y
     */
    Find(x: number, y: number): Object;
    /**
     * Вписать весь контур в заданные габариты
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    Fit(x1: number, y1: number, x2: number, y2: number);
    /**
     * Растянуть контур резиновой нитью
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param dx
     * @param dy
     */
    Elastic(x1: number, y1: number, x2: number, y2: number, dx: number, dy: number);
    /**
     * Отразить контур относительно линии
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param Copy
     */
    Symmetry(x1: number, y1: number, x2: number, y2: number, Copy: boolean);
    /**
     * Загрузить контур из файла *.frw
     * @param file
     */
    Load(file: string): boolean;
    /**
     * Находится ли точка внутри контура?
     * @param x
     * @param y
     */
    IsPointInside(x: number, y: number): boolean;
    /**
     * Находится ли контур внутри другого?
     * @param contour
     */
    IsInContour(contour: Contour2D): boolean;
    /**
     * Является ли контур замкнутым?
     */
    IsClosedContour(): boolean;
    /**
     * Является ли контур прямоугольным?
     */
    IsContourRectangle(): boolean;
    /**
     * Упорядочить элеметны контура в одном направлении
     * @param closet
     */
    OrderContours(closet): boolean;

}

declare interface Geometry2D{
    /**
     * Вычислить точки пересечения двухмерных элементов
     * @param elem1
     * @param elem2
     */
    Intersect(elem1, elem2): Array<Point>;
    /**
     * Сравнить элементы
     * @param elem1
     * @param elem2
     */
    Compare(elem1, elem2): boolean;
    /**
     * Найти кратчайшее расстояние между элементами
     * @param elem1
     * @param elem2
     */
    Distance(elem1, elem2): number;
    /**
     * Найти площадь контура
     * @param contour
     */
    Area(contour: Contour2D): number;

}

declare interface InControl{
    /**
     * 
     */
    id: number;
    /**
     * 
     */
    Enabled: boolean;
    /**
     * 
     */
    Visible: boolean;
    /**
     * 
     */
    Hint: string;
    /**
     * Обработчик
     */
    OnChange: Function;

}

declare interface InButton extends InControl{
    /**
     * Создать подменю
     * @param caption
     */
    NewSubMenu(caption: string): InButton;
    /**
     * 
     */
    Combo: boolean;

}

declare interface InFloat extends InControl{
    /**
     * 
     */
    Value: number;
    /**
     * 
     */
    ReadOnly: boolean;
    /**
     * 
     */
    Fixed: boolean;

}

declare interface InNumber extends InControl{
    /**
     * 
     */
    Value: number;
    /**
     * 
     */
    ReadOnly: boolean;
    /**
     * 
     */
    Fixed: boolean;

}

declare interface InMaterial extends InControl{
    /**
     * 
     */
    Name: string;
    /**
     * 
     */
    Thickness: number;
    /**
     * 
     */
    Width: number;
    /**
     * Установить активным. Все последующие элементы будут построены из этого материала
     */
    SetActive();
    /**
     * Применить материал к указанному объекту
     * @param obj
     */
    Apply(obj: Object3);

}

declare interface InButtMaterial extends InControl{
    /**
     * 
     */
    Name: string;
    /**
     * 
     */
    Sign: string;
    /**
     * 
     */
    Thickness: number;
    /**
     * 
     */
    Width: number;
    /**
     * 
     */
    Overhung: number;
    /**
     * 
     */
    Allowance: number;
    /**
     * 
     */
    ClipPanel: boolean;

}

declare interface InFurniture extends InControl{
    /**
     * Установить крепеж между двух панелей
     * @param panel1
     * @param panel2
     * @param x
     * @param y
     * @param z
     */
    Mount(panel1: Panel, panel2: Panel, x: number, y: number, z: number): Object3;
    /**
     * Установить крепеж на плоскость панели
     * @param panel
     * @param x
     * @param y
     * @param z
     * @param angle Угол (в градусах)
     */
    Mount1(panel: Panel, x: number, y: number, z: number, angle: number): Object3;

}

declare interface InfFurniture{
    /**
     * Установить крепеж между двух панелей
     * @param panel1
     * @param panel2
     * @param x
     * @param y
     * @param z
     */
    Mount(panel1: Panel, panel2: Panel, x: number, y: number, z: number): Object3;
    /**
     * Установить крепеж на плоскость панели
     * @param panel
     * @param x
     * @param y
     * @param z
     * @param angle Угол (В градусах)
     */
    Mount1(panel: Panel, x: number, y: number, z: number, angle: number): Object3;

}

declare interface DoorsMaker{
    /**
     * 
     */
    Silent: boolean;
    /**
     * 
     */
    ShowErrors: boolean;
    /**
     * Сохранить параметры установки дверей в файл
     * @param filename
     */
    Save(filename: string);
    /**
     * Загрузить параметры установки дверей из файла
     * @param filename
     */
    Load(filename: string): boolean;
    /**
     * Установить двери в секцию (Объект - Panel или Edge)
     * @param LeftObject
     * @param RightObject
     * @param TopObject
     * @param BottomObject
     */
    Setup(LeftObject: Panel | Edge3, RightObject: Panel | Edge3, TopObject: Panel | Edge3, BottomObject: Panel | Edge3);

}

declare interface BoxesMaker{
    /**
     * 
     */
    ShowErrors: boolean;
    /**
     * Сохранить параметры установки ящиков в файл
     * @param filename
     */
    Save(filename: string);
    /**
     * Загрузить параметры установки ящиков из файла
     * @param filename
     */
    Load(filename: string): boolean;
    /**
     * Установить ящик в секцию. LeftObject, RightObject - панели. TopObject, BottomObject - Panel или Edge
     * @param LeftObject Левая панель
     * @param RightObject Правая панель
     * @param TopObject Верхняя граница (Панель или ребро)
     * @param BottomObject Нижняя граница (Панель или ребро)
     */
    Setup(LeftObject: Panel, RightObject:Panel, TopObject: Panel | Edge3, BottomObject: Panel | Edge3);

}

declare interface ScItemTovar{
    /**
     * Артикул элемента товара
     */
    Article: string;
    /**
     * Имя элемента товара
     */
    Name: string;
    /**
     * Текущий материал
     */
    Material: string;
    /**
     * Имя группы материалов на замену
     */
    GroupMaterial: string;
    /**
     * Имя типа элемента
     */
    TypeElement: string;
    /**
     * Список объектов из модели входящих в состав элемента товара
     */
    ObjList: List3D;

}

declare interface ScItemTovarList{
    /**
     * Доступ к элементу товара по индексу
     * @param [index]
     */
    Items([index]): ScItemTovar;
    /**
     * Количество элементов товара
     */
    Count: number;
    /**
     * Имя товара
     */
    TovarName: string;
    /**
     * Найти элемент товара по имени
     * @param name
     * @param CaseSensitive
     */
    FindByName(name: string, CaseSensitive): ScItemTovar;

}





declare interface Arguments extends Object{
    /**
     * 
     */
    callee: Function;
    /**
     * 
     */
    length: number;

}
/**
 * Создать 3D точку по координатам
 * @param x
 * @param y
 * @param z
 */
declare function NewVector(x: number, y: number, z: number): Vector;

/**
 * Создать 2D точку по координатам
 * @param x
 * @param y
 */
declare function NewPoint(x: number, y: number): Point;

/**
 * Создать плоский контур
 */
declare function NewContour(): Contour2D;

/**
 * Создать новый COM объект по его типу
 * @param CLSID
 */
declare function NewCOMObject(CLSID: string): IDispatch;

/**
 * Создать форму со свойствами
 */
declare function NewForm(): ScriptForm;

/**
 * Создать базу параметрического крепежа
 */
declare function NewParamFastenerDB(): ScriptParamFastenerDB;

/**
 * 
 */
declare var AxisX: Vector;

/**
 * 
 */
declare var AxisY: Vector;

/**
 * 
 */
declare var AxisZ: Vector;

/**
 * 
 */
declare var Axis_X: Vector;

/**
 * 
 */
declare var Axis_Y: Vector;

/**
 * 
 */
declare var Axis_Z: Vector;

/**
 * Системные функции
 */
declare var system: System;

/**
 * Структура модели
 */
declare var Model: Model3D;

/**
 * Вспомогательные геометрические функции
 */
declare var geometry: Geometry2D;

/**
 * Активный скрипт
 */
declare var Action: Action3D;

/**
 * Текущий материал
 */
declare var ActiveMaterial: FurnMaterial;

/**
 * История модели
 */
declare var Undo: Undo3D;

/**
 * Вывести окно ввода строки
 * @param message
 */
declare function prompt(message): string;

/**
 * Вывести окно сообщения
 * @param str
 */
declare function alert(str);

/**
 * Показать окно подтверждения (Да/Нет)
 * @param message
 */
declare function confirm(message): boolean;

/**
 * Открыть фурнитуру для установки на модель
 * @param filename
 */
declare function OpenFurniture(filename: string): InfFurniture;

/**
 * Выделить всё
 */
declare function SelectAll();

/**
 * Снять выделение с модели
 */
declare function UnSelectAll();

/**
 * Показать всё
 */
declare function ViewAll();

/**
 * Установить текущий вид
 * @param p3d
 */
declare function SetCamera(p3d: Vector);

/**
 * Запрос точки
 * @param hint
 */
declare function GetPoint(hint: string): Vector;

/**
 * Запрос объекта модели
 * @param hint
 */
declare function GetObject(hint: string): Object3;

/**
 * Запрос панели
 * @param hint
 */
declare function GetPanel(hint: string): Panel;

/**
 * Запрос выбора ребра, параллельного указанному вектору
 * @param hint
 * @param Axis
 */
declare function GetEdge(hint: string, Axis: Vector): Edge3;

/**
 * Создать панель указанных размеров
 * @param width
 * @param height
 */
declare function AddPanel(width: number, height: number): Panel;

/**
 * Создать фронтальную панель
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param z
 */
declare function AddFrontPanel(x1: number, y1: number, x2: number, y2: number, z: number): Panel;

/**
 * Создать горизонтальную панель
 * @param x1
 * @param z1
 * @param x2
 * @param z2
 * @param y
 */
declare function AddHorizPanel(x1: number, z1: number, x2: number, z2: number, y: number): Panel;

/**
 * Создать вертикальную панель
 * @param z1
 * @param y1
 * @param z2
 * @param y2
 * @param x
 */
declare function AddVertPanel(z1: number, y1: number, z2: number, y2: number, x: number): Panel;

/**
 * Создать профиль
 * @param name
 */
declare function AddExtrusion(name: string): Extrusion;

/**
 * Создать тело по траектории
 * @param name
 */
declare function AddTrajectory(name: string): Trajectory;

/**
 * Создать мебельный блок
 * @param name
 */
declare function AddBlock(name: string): Block;

/**
 * Создать полуфабрикат
 * @param name
 */
declare function AddDraftBlock(name: string): Block;

/**
 * Создать мебельную сборку
 * @param name
 */
declare function AddAssembly(name: string): Block;

/**
 * Создать копию объекта
 * @param obj
 */
declare function AddCopy(obj: Object3): Object3;

/**
 * Создать симметричную копию объекта
 * @param obj
 * @param  pos 
 * @param  normal
 */
declare function AddSymmetry(obj: string, pos: Vector, normal: Vector): Object3;

/**
 * Создать вспомогательный контур в пространстве
 */
declare function AddContour(): Contour3D;

/**
 * Создать размер
 * @param pos1
 * @param pos2
 * @param toppos
 */
declare function AddSize(pos1: Vector, pos2: Vector, toppos: Vector): Size3D;

/**
 * Удалить объекты ранее созданные в скрипте
 */
declare function DeleteNewObjects();

/**
 * Удалить объект из модели
 * @param obj
 */
declare function DeleteObject(obj: Object3);

/**
 * Функция начала редактирования объекта
 * @param obj
 */
declare function StartEditing(obj: Object3): Object3;

/**
 * Начать создание блока. Все созданные далее объекты попадают внутрь блока
 * @param name
 */
declare function BeginBlock(name: string): Block;

/**
 * Закончить создание блока
 */
declare function EndBlock();

/**
 * Начать создание редактируемого блока
 * @param name
 */
declare function BeginParametricBlock(name: string): Block;

/**
 * Закончить создание редактируемого блока
 */
declare function EndParametricBlock();

/**
 * Редактируемый блок. Переменная установлена, если скрипт запущен в режиме редактирования
 */
declare var ParametricBlock: Block;

/**
 * Создать элемент управления - кнопку
 * @param caption
 */
declare function NewButtonInput(caption: string): InButton;

/**
 * Создать элемент управления для ввода целого числа
 * @param caption
 */
declare function NewFloatInput(caption: string): InFloat;

/**
 * Создать элемент управления для ввода числа
 * @param caption
 */
declare function NewNumberInput(caption: string): InNumber;

/**
 * Создать элемент управления для выбора материала
 * @param caption
 */
declare function NewMaterialInput(caption: string): InMaterial;

/**
 * Создать элемент управления для выбора кромочного материала
 * @param caption
 */
declare function NewButtMaterialInput(caption: string): InButtMaterial;

/**
 * Создать элемент управления для выбора фурнитуры
 * @param caption
 */
declare function NewFurnitureInput(caption: string): InFurniture;

/**
 * Создать элемент управления для анализа модели
 */
declare function NewModelInspector(): ModelInspector;

/**
 * Создать мастер установки дверей
 * @param caption
 */
declare function NewDoorsMaker(caption: string): DoorsMaker;

/**
 * Создать мастер установки ящиков
 * @param caption
 */
declare function NewBoxesMaker(caption: string): BoxesMaker;

/**
 * Список элементов товара. Только для Салона
 */
declare var TovarItems: ScItemTovarList;

