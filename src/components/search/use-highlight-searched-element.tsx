/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes } from '@gridsuite/commons-ui';
import { useTheme } from '@mui/material';
import {
    GridApi,
    GridReadyEvent,
    RowClassParams,
    RowStyle,
} from 'ag-grid-community';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedElement } from '../../redux/actions';
import { ReduxState } from '../../redux/reducer.type';

const SEARCH_HIGHLIGHT_DURATION_MS = 4000;

export const useHighlightSearchedElement = (gridApi: GridApi | null) => {
    const searchedElement = useSelector(
        (state: ReduxState) => state.searchedElement
    );
    const dispatch = useDispatch();
    const theme = useTheme();

    const highlightElement = useCallback(
        (api: GridApi) => {
            // if there is a searched element, we scroll to it, style it for SEARCH_HIGHTLIGHT_DURATION, then remove it from searchedElement to go back to previous style
            if (!searchedElement) {
                return;
            }
            const searchedElementRow = api.getRowNode(searchedElement.id);
            if (
                searchedElementRow?.rowIndex != null &&
                searchedElementRow?.rowIndex >= 0
            ) {
                api.ensureIndexVisible(searchedElementRow.rowIndex, 'top');
                setTimeout(() => {
                    dispatch(setSearchedElement(null));
                }, SEARCH_HIGHLIGHT_DURATION_MS);
            }
        },
        [dispatch, searchedElement]
    );

    const onGridReady = useCallback(
        ({ api }: GridReadyEvent<ElementAttributes>) => {
            highlightElement(api);
        },
        [highlightElement]
    );

    useEffect(() => {
        if (gridApi) {
            highlightElement(gridApi);
        }
    }, [highlightElement, gridApi]);

    const getRowStyle = useCallback(
        (cellData: RowClassParams<ElementAttributes, any>) => {
            const style: RowStyle = { fontSize: '1rem' };
            if (cellData?.data?.elementUuid === searchedElement?.id) {
                style.backgroundColor = theme.row.hover;
            }
            return style;
        },
        [searchedElement?.id, theme.row.hover]
    );

    return [onGridReady, getRowStyle];
};
