/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes } from '@gridsuite/commons-ui';
import { GridReadyEvent, RowClassParams, RowStyle } from 'ag-grid-community';
import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedElement } from '../../redux/actions';
import { ReduxState } from '../../redux/reducer.type';

const SEARCH_HIGHLIGHT_DURATION_S = 4;

export const useHighlightSearchedElement = () => {
    const searchedElement = useSelector(
        (state: ReduxState) => state.searchedElement
    );
    const dispatch = useDispatch();
    const timeout = useRef<ReturnType<typeof setTimeout>>();

    const onGridReady = useCallback(
        ({ api }: GridReadyEvent<ElementAttributes>) => {
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
                clearTimeout(timeout.current);
                timeout.current = setTimeout(() => {
                    dispatch(setSearchedElement(null));
                }, SEARCH_HIGHLIGHT_DURATION_S * 1000);
            }
        },
        [searchedElement, dispatch]
    );

    const getRowStyle = useCallback(
        (cellData: RowClassParams<ElementAttributes, any>) => {
            const style: RowStyle = { fontSize: '1rem' };
            if (cellData?.data?.elementUuid === searchedElement?.id) {
                // keyframe "highlighted-element" has to be defined in css containing highlighted element
                style[
                    'animation'
                ] = `highlighted-element ${SEARCH_HIGHLIGHT_DURATION_S}s`;
            }
            return style;
        },
        [searchedElement?.id]
    );

    return [onGridReady, getRowStyle];
};
