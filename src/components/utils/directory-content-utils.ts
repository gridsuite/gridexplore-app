/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    DateCellRenderer,
    DescriptionCellRenderer,
    NameCellRenderer,
    TypeCellRenderer,
    UserCellRenderer,
} from '../../utils/directory-content-renderers';
import { IntlShape } from 'react-intl';
import { UUID } from 'crypto';
import { IElementMetadata } from '../../redux/reducer.type';

export const defaultColumnDefinition = {
    sortable: true,
    resizable: false,
    lockPinned: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    suppressMovable: true,
    flex: 1,
};
export const getColumnsDefinition = (
    childrenMetadata: Record<UUID, IElementMetadata>,
    intl: IntlShape
) => [
    {
        headerName: intl.formatMessage({
            id: 'elementName',
        }),
        field: 'elementName',
        cellRenderer: NameCellRenderer,
        cellRendererParams: {
            childrenMetadata: childrenMetadata,
        },
        headerCheckboxSelection: true,
        checkboxSelection: true,
        flex: 5,
    },
    {
        headerName: intl.formatMessage({
            id: 'description',
        }),
        field: 'description',
        cellRenderer: DescriptionCellRenderer,
        maxWidth: '150',
    },
    {
        headerName: intl.formatMessage({
            id: 'type',
        }),
        field: 'type',
        cellRenderer: TypeCellRenderer,
        cellRendererParams: {
            childrenMetadata: childrenMetadata,
        },
        flex: 2,
    },
    {
        headerName: intl.formatMessage({
            id: 'creator',
        }),
        field: 'owner',
        cellRenderer: UserCellRenderer,
        maxWidth: '150',
    },
    {
        headerName: intl.formatMessage({
            id: 'created',
        }),
        field: 'creationDate',
        cellRenderer: DateCellRenderer,
        maxWidth: '150',
        flex: 2,
    },
    {
        headerName: intl.formatMessage({
            id: 'modifiedBy',
        }),
        field: 'lastModifiedBy',
        cellRenderer: UserCellRenderer,
        maxWidth: '150',
    },
    {
        headerName: intl.formatMessage({
            id: 'modified',
        }),
        field: 'lastModificationDate',
        cellRenderer: DateCellRenderer,
        maxWidth: '150',
        flex: 2,
    },
];
