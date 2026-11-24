/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IntlShape } from 'react-intl';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import {
    createMultiEnumFilterParams,
    CustomAggridAutocompleteFilter,
    type CustomAggridAutocompleteFilterParams,
    CustomAggridComparatorFilter,
    FilterDataTypes,
    FilterTextComparators,
    makeAgGridCustomHeaderColumn,
    type SortParams,
    TableType,
} from '@gridsuite/commons-ui';
import { DateCellRenderer } from '../../utils/renderers/date-cell-renderer';
import { UserCellRenderer } from '../../utils/renderers/user-cell-renderer';
import { getElementTypeTranslation } from '../../utils/translation-utils';
import type { ReferencingElement } from '../../../utils/referencing-element-infos.type';
import { PathCellRenderer } from './path-cell-renderer';
import { ElementNameCellRenderer } from './element-name-cell-renderer';

const SHARING_LINKS_TAB = 'sharingLinks';

const sortParams: SortParams = { table: TableType.SharingLinks, tab: SHARING_LINKS_TAB };

const filterParams = { type: TableType.SharingLinks, tab: SHARING_LINKS_TAB, dataType: FilterDataTypes.TEXT };

const textColumnContext = {
    sortParams,
    filterComponent: CustomAggridComparatorFilter,
    filterComponentParams: {
        filterParams: {
            ...filterParams,
            comparators: [FilterTextComparators.STARTS_WITH, FilterTextComparators.CONTAINS],
        },
    },
};

// the options of the filter are the distinct values of the column
const enumColumn = {
    filterParams: createMultiEnumFilterParams(),
    context: {
        sortParams,
        filterComponent: CustomAggridAutocompleteFilter,
        filterComponentParams: { filterParams },
    },
};

export const defaultColumnDefinition: ColDef<ReferencingElement> = {
    // the native sort and filter are driven by the custom headers
    sortable: true,
    filter: true,
    resizable: true,
    lockPinned: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    flex: 1,
    cellStyle: { display: 'flex', alignItems: 'center' },
};

export const getColumnsDefinition = (intl: IntlShape): ColDef[] => [
    makeAgGridCustomHeaderColumn<CustomAggridAutocompleteFilterParams>({
        headerName: intl.formatMessage({ id: 'directoryContent.column.name' }),
        colId: 'elementName',
        field: 'elementName',
        cellRenderer: ElementNameCellRenderer,
        ...enumColumn,
    }),
    makeAgGridCustomHeaderColumn<CustomAggridAutocompleteFilterParams>({
        headerName: intl.formatMessage({ id: 'directoryContent.column.type' }),
        colId: 'type',
        valueGetter: ({ data }: ValueGetterParams<ReferencingElement>) =>
            data ? getElementTypeTranslation(data.type, null, null, intl) : '',
        ...enumColumn,
    }),
    makeAgGridCustomHeaderColumn({
        headerName: intl.formatMessage({ id: 'path' }),
        colId: 'path',
        // the joined path is used for sorting and filtering
        valueGetter: ({ data }: ValueGetterParams<ReferencingElement>) =>
            data?.path.map(({ elementName }) => elementName).join('/') ?? '',
        cellRenderer: PathCellRenderer,
        flex: 2,
        context: textColumnContext,
    }),
    makeAgGridCustomHeaderColumn({
        headerName: intl.formatMessage({ id: 'node' }),
        colId: 'node',
        field: 'node',
        context: textColumnContext,
    }),
    makeAgGridCustomHeaderColumn<CustomAggridAutocompleteFilterParams>({
        headerName: intl.formatMessage({ id: 'directoryContent.column.creator' }),
        colId: 'ownerLabel',
        field: 'ownerLabel',
        cellRenderer: UserCellRenderer,
        ...enumColumn,
    }),
    makeAgGridCustomHeaderColumn({
        headerName: intl.formatMessage({ id: 'directoryContent.column.modified' }),
        colId: 'lastModificationDate',
        field: 'lastModificationDate',
        cellRenderer: DateCellRenderer,
        context: { sortParams },
    }),
    makeAgGridCustomHeaderColumn<CustomAggridAutocompleteFilterParams>({
        headerName: intl.formatMessage({ id: 'directoryContent.column.modifiedBy' }),
        colId: 'lastModifiedByLabel',
        field: 'lastModifiedByLabel',
        cellRenderer: UserCellRenderer,
        ...enumColumn,
    }),
];
