import {
  SlickgridReactInstance,
  Column,
  ColumnEditorDualInput,
  Editors,
  FieldType,
  Filters,
  formatNumber,
  Formatters,
  GridOption,
  SlickGrid,
  SlickNamespace,
  SlickgridReact,
  DOMEvent
} from '../../slickgrid-react';
import React from 'react';
import './example20.scss'; // provide custom CSS/SASS styling
import BaseSlickGridState from './state-slick-grid-base';

declare const Slick: SlickNamespace;

interface Props { }
interface State extends BaseSlickGridState {
  frozenColumnCount: number;
  frozenRowCount: number;
  isFrozenBottom: boolean;
}

export default class Example20 extends React.Component<Props, State> {
  title = 'Example 20: Pinned (frozen) Columns/Rows';
  subTitle = `
    This example demonstrates the use of Pinned (aka frozen) Columns and/or Rows (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/Pinned-(aka-Frozen)-Columns-Rows" target="_blank">Wiki docs</a>)
    <ul>
      <li>Option to pin any number of columns (left only) or rows</li>
      <li>Option to pin the rows at the bottom instead of the top (default)</li>
      <li>You can also dynamically any of these options, through SlickGrid "setOptions()"</li>
      <li>Possibility to change the styling of the line border between pinned columns/rows</li>
    </ul>
  `;

  reactGrid!: SlickgridReactInstance;
  gridObj!: SlickGrid;
  slickEventHandler: any;

  constructor(public readonly props: Props) {
    super(props);
    this.slickEventHandler = new Slick.EventHandler();

    this.state = {
      gridOptions: undefined,
      columnDefinitions: [],
      frozenColumnCount: 2,
      frozenRowCount: 3,
      isFrozenBottom: false,
    };
  }

  reactGridReady(reactGrid: SlickgridReactInstance) {
    this.reactGrid = reactGrid;
    this.gridObj = reactGrid && reactGrid.slickGrid;

    // with frozen (pinned) grid, in order to see the entire row being highlighted when hovering
    // we need to do some extra tricks (that is because frozen grids use 2 separate div containers)
    // the trick is to use row selection to highlight when hovering current row and remove selection once we're not
    this.slickEventHandler.subscribe(this.gridObj.onMouseEnter, (event: Event) => this.highlightRow(event, true));
    this.slickEventHandler.subscribe(this.gridObj.onMouseLeave, (event: Event) => this.highlightRow(event, false));
  }

  highlightRow(event: Event, isMouseEnter: boolean) {
    const cell = this.gridObj.getCellFromEvent(event);
    const rows = isMouseEnter ? [cell?.row ?? 0] : [];
    this.gridObj.setSelectedRows(rows); // highlight current row
    event.preventDefault();
  }

  componentDidMount() {
    document.title = this.title;

    this.defineGrid();
  }

  componentWillUnmount() {
    // unsubscribe every SlickGrid subscribed event (or use the Slick.EventHandler)
    this.slickEventHandler.unsubscribeAll();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'sel', name: '#', field: 'id',
        minWidth: 40, width: 40, maxWidth: 40,
        cannotTriggerInsert: true,
        resizable: false,
        unselectable: true,
      },
      {
        id: 'title', name: 'Title', field: 'title',
        minWidth: 100, width: 120,
        filterable: true,
        sortable: true
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete',
        resizable: false,
        minWidth: 130, width: 140,
        formatter: Formatters.percentCompleteBar,
        type: FieldType.number,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        sortable: true
      },
      {
        id: 'start', name: 'Start', field: 'start',
        minWidth: 100, width: 120,
        filterable: true, sortable: true,
        formatter: Formatters.dateIso
      },
      {
        id: 'finish', name: 'Finish', field: 'finish',
        minWidth: 100, width: 120,
        filterable: true, sortable: true,
        formatter: Formatters.dateIso
      },
      {
        id: 'cost', name: 'Cost | Duration', field: 'cost',
        formatter: this.costDurationFormatter.bind(this),
        minWidth: 150, width: 170,
        sortable: true,
        // filterable: true,
        filter: {
          model: Filters.compoundSlider,
        },
        editor: {
          model: Editors.dualInput,
          // the DualInputEditor is of Type ColumnEditorDualInput and MUST include (leftInput/rightInput) in its params object
          // in each of these 2 properties, you can pass any regular properties of a column editor
          // and they will be executed following the options defined in each
          params: {
            leftInput: {
              field: 'cost',
              type: 'float',
              decimal: 2,
              minValue: 0,
              maxValue: 50000,
              placeholder: '< 50K',
              errorMessage: 'Cost must be positive and below $50K.',
            },
            rightInput: {
              field: 'duration',
              type: 'float', // you could have 2 different input type as well
              minValue: 0,
              maxValue: 100,
              title: 'make sure Duration is withing its range of 0 to 100',
              errorMessage: 'Duration must be between 0 and 100.',

              // Validator Option #1
              // You could also optionally define a custom validator in 1 or both inputs
              /*
              validator: (value, args) => {
                let isValid = true;
                let errorMsg = '';
                if (value < 0 || value > 120) {
                  isValid = false;
                  errorMsg = 'Duration MUST be between 0 and 120.';
                }
                return { valid: isValid, msg: errorMsg };
              }
              */
            },
          } as ColumnEditorDualInput,

          // Validator Option #2 (shared Validator) - this is the last alternative, option #1 (independent Validators) is still the recommended way
          // You can also optionally use a common Validator (if you do then you cannot use the leftInput/rightInput validators at same time)
          // to compare both values at the same time.
          /*
          validator: (values, args) => {
            let isValid = true;
            let errorMsg = '';
            if (values.cost < 0 || values.cost > 50000) {
              isValid = false;
              errorMsg = 'Cost MUST be between 0 and 50k.';
            }
            if (values.duration < 0 || values.duration > 120) {
              isValid = false;
              errorMsg = 'Duration MUST be between 0 and 120.';
            }
            if (values.cost < values.duration) {
              isValid = false;
              errorMsg = 'Cost can never be lower than its Duration.';
            }
            return { valid: isValid, msg: errorMsg };
          }
          */
        }
      },
      {
        id: 'effortDriven', name: 'Effort Driven', field: 'effortDriven',
        minWidth: 100, width: 120,
        formatter: Formatters.checkmark,
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
        sortable: true
      },
      {
        id: 'title1', name: 'Title 1', field: 'title1',
        minWidth: 100, width: 120,
        filterable: true,
        sortable: true
      },
      {
        id: 'title2', name: 'Title 2', field: 'title2',
        minWidth: 100, width: 120,
        filterable: true,
        sortable: true
      },
      {
        id: 'title3', name: 'Title 3', field: 'title3',
        minWidth: 100, width: 120,
        filterable: true,
        sortable: true
      },
      {
        id: 'title4', name: 'Title 4', field: 'title4',
        minWidth: 100, width: 120,
        filterable: true,
        sortable: true
      }
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      gridWidth: 920,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      enableExcelCopyBuffer: true,
      frozenColumn: 2,
      frozenRow: 3,
      // frozenBottom: true, // if you want to freeze the bottom instead of the top, you can enable this property

      // show both Frozen Columns in HeaderMenu & GridMenu, these are opt-in commands so they're disabled by default
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false }
    };

    this.setState((state: State) => ({
      ...state,
      gridOptions,
      columnDefinitions,
      dataset: this.getData()
    }));
  }

  getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        cost: (i % 33 === 0) ? null : Math.random() * 10000,
        duration: i % 8 ? (Math.round(Math.random() * 100) + '') : null,
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 4, 5),
        effortDriven: (i % 5 === 0),
        title1: `Some Text ${Math.round(Math.random() * 25)}`,
        title2: `Some Text ${Math.round(Math.random() * 25)}`,
        title3: `Some Text ${Math.round(Math.random() * 25)}`,
        title4: `Some Text ${Math.round(Math.random() * 25)}`,
      };
    }
    return mockDataset;
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  changeFrozenColumnCount(e: React.FormEvent<HTMLInputElement>) {
    this.setState((state: State) => ({
      ...state,
      frozenColumnCount: +((e.target as HTMLInputElement)?.value ?? 0),
    }));
  }

  setFrozenColumnCount() {
    this.gridObj?.setOptions({
      frozenColumn: this.state.frozenColumnCount
    });
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  changeFrozenRowCount(e: React.FormEvent<HTMLInputElement>) {
    this.setState((state: State) => ({
      ...state,
      frozenRowCount: +((e.target as HTMLInputElement)?.value ?? 0),
    }));
  }

  setFrozenRowCount() {
    this.gridObj?.setOptions({
      frozenRow: this.state.frozenRowCount
    });
  }

  costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
    const costText = this.isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
    let durationText = 'n/a';
    if (!this.isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0) {
      durationText = `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`;
    }
    return `<b>${costText}</b> | ${durationText}`;
  }

  isNullUndefinedOrEmpty(data: any) {
    return (data === '' || data === null || data === undefined);
  }

  onCellValidationError(_e: Event, args: any) {
    alert(args.validationResults.msg);
  }

  setFrozenColumns(frozenCols: number) {
    this.gridObj.setOptions({ frozenColumn: frozenCols });

    this.setState((state: State) => ({
      ...state,
      gridOptions: this.gridObj.getOptions(),
    }));
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  toggleFrozenBottomRows() {
    if (this.gridObj && this.gridObj.setOptions) {
      this.gridObj.setOptions({
        frozenBottom: !this.state.isFrozenBottom
      });

      this.setState((state: State) => ({
        ...state,
        isFrozenBottom: !state.isFrozenBottom,
      }));
    }
  }

  render() {
    return !this.state.gridOptions ? '' : (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-end font18">
            see&nbsp;
            <a target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example20.tsx">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle" dangerouslySetInnerHTML={{ __html: this.subTitle }}></div>

        <br />

        <div className="row">
          <div className="col-sm-12">
            <span>
              <label htmlFor="">Pinned Rows: </label>
              <input type="number" defaultValue={this.state.frozenRowCount} onInput={($event) => this.changeFrozenRowCount($event)} />
              <button className="btn btn-outline-secondary btn-xs" onClick={() => this.setFrozenRowCount()}>
                Set
              </button>
            </span>
            <span style={{ marginLeft: '10px' }}>
              <label htmlFor="">Pinned Columns: </label>
              <input type="number" defaultValue={this.state.frozenColumnCount} onInput={($event) => this.changeFrozenColumnCount($event)} />
              <button className="btn btn-outline-secondary btn-xs" onClick={() => this.setFrozenColumnCount()}>
                Set
              </button>
            </span>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-sm-12">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => this.setFrozenColumns(-1)}
              data-test="remove-frozen-column-button">
              <i className="fa fa-times fa-lg"></i> Remove Frozen Columns
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => this.setFrozenColumns(2)}
              data-test="set-3frozen-columns">
              <i className="fa fa-thumb-tack fa-lg"></i> Set 3 Frozen Columns
            </button>
            <span style={{ marginLeft: '15px' }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => this.toggleFrozenBottomRows()}>
                <i className="fa fa-random fa-lg"></i> Toggle Pinned Rows
              </button>
              <span style={{ fontWeight: 'bold' }}>: {this.state.isFrozenBottom ? 'Bottom' : 'Top'}</span>
            </span>
          </div>
        </div>

        <div className="col-sm-12">
          <hr />
        </div>

        <SlickgridReact gridId="grid20"
          columnDefinitions={this.state.columnDefinitions}
          gridOptions={this.state.gridOptions}
          dataset={this.state.dataset}
          onReactGridCreated={$event => this.reactGridReady($event.detail)}
          onValidationError={$event => this.onCellValidationError($event.detail.eventData, $event.detail.args)}
        />
      </div>
    );
  }
}
