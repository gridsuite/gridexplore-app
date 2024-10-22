/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes } from '@gridsuite/commons-ui';
import { GridApi, GridReadyEvent, RowClassParams, RowStyle } from 'ag-grid-community';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedElement } from '../../redux/actions';
import { AppDispatch } from '../../redux/store';
import { AppState } from '../../redux/types';

const SEARCH_HIGHLIGHT_DURATION_S = 4;

export const useHighlightSearchedElement = (gridApi: GridApi | null) => {
    const searchedElement = useSelector((state: AppState) => state.searchedElement);
    const dispatch = useDispatch<AppDispatch>();
    const timeout = useRef<ReturnType<typeof setTimeout>>();

    const highlightElement = useCallback(
        (api: GridApi<ElementAttributes>) => {
            // if there is a searched element, we scroll to it, style it for SEARCH_HIGHTLIGHT_DURATION, then remove it from searchedElement to go back to previous style
            if (!searchedElement) {
                return;
            }
            const searchedElementRow = api.getRowNode(searchedElement.id);
            if (searchedElementRow?.rowIndex != null && searchedElementRow?.rowIndex >= 0) {
                api.ensureIndexVisible(searchedElementRow.rowIndex, 'top');
                clearTimeout(timeout.current);
                timeout.current = setTimeout(() => {
                    dispatch(setSearchedElement(null));
                }, SEARCH_HIGHLIGHT_DURATION_S * 1000);
            }
        },
        [searchedElement, dispatch]
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
        (cellData: RowClassParams<ElementAttributes, unknown>) => {
            const style: RowStyle = { fontSize: '1rem' };
            if (cellData?.data?.elementUuid === searchedElement?.id) {
                // keyframe "highlighted-element" has to be defined in css containing highlighted element
                style.animation = `highlighted-element ${SEARCH_HIGHLIGHT_DURATION_S}s`;
            }
            return style;
        },
        [searchedElement?.id]
    );

    return [onGridReady, getRowStyle] as const;
};
