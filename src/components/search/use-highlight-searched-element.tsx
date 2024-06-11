import { ElementAttributes } from '@gridsuite/commons-ui';
import { useTheme } from '@mui/material';
import { GridReadyEvent, RowClassParams, RowStyle } from 'ag-grid-community';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedElement } from 'redux/actions';
import { ReduxState } from 'redux/reducer.type';

const SEARCH_HIGHLIGHT_DURATION_MS = 4000;

export const useHighlightSearchedElement = () => {
    const searchedElement = useSelector(
        (state: ReduxState) => state.searchedElement
    );
    const dispatch = useDispatch();
    const theme = useTheme();

    const onGridReady = useCallback(
        ({ api }: GridReadyEvent<ElementAttributes>) => {
            // if there is a searched element, we scroll to it, style it for SEARCH_HIGHTLIGHT_DURATION, then remove it from searchedElement to go back to previous style
            if (!searchedElement) {
                return;
            }
            const searchedElementRow = api.getRowNode(searchedElement.id);
            if (searchedElementRow?.rowIndex) {
                api.ensureIndexVisible(searchedElementRow.rowIndex, 'top');
                setTimeout(() => {
                    dispatch(setSearchedElement(null));
                }, SEARCH_HIGHLIGHT_DURATION_MS);
            }
        },
        [searchedElement, dispatch]
    );

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
