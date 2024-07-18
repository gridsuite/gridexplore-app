/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, RefObject, useCallback, useRef } from 'react';
import { searchElementsInfos } from '../../utils/rest-api';
import {
    ElementSearchInput,
    ElementType,
    useElementSearch,
    useSnackMessage,
    fetchDirectoryContent,
} from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import {
    setSearchedElement,
    setSelectedDirectory,
    setTreeData,
} from '../../redux/actions';
import { updatedTree } from '../tree-views-container';
import { SearchItem } from './search-item';
import {
    AppState,
    ElementAttributesES,
    IDirectory,
    ITreeData,
} from '../../redux/reducer';
import { ElementSearchInputProps } from '@gridsuite/commons-ui/dist/components/ElementSearchDialog/element-search-input';
import { TextFieldProps } from '@mui/material';
import { SearchBarRenderInput } from './search-bar-render-input';
import { UUID } from 'crypto';
import { AppDispatch } from '../../redux/store';

export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

interface SearchBarProps {
    inputRef: RefObject<TextFieldProps>;
}

export const SearchBar: FunctionComponent<SearchBarProps> = ({ inputRef }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { snackError } = useSnackMessage();
    const treeData = useSelector((state: AppState) => state.treeData);
    const treeDataRef = useRef<ITreeData>();
    const selectedDirectory = useSelector(
        (state: AppState) => state.selectedDirectory
    );
    treeDataRef.current = treeData;

    const fetchElements: (
        newSearchTerm: string
    ) => Promise<ElementAttributesES[]> = useCallback(
        (newSearchTerm) =>
            searchElementsInfos(newSearchTerm, selectedDirectory?.elementUuid),
        [selectedDirectory?.elementUuid]
    );

    const { elementsFound, isLoading, searchTerm, updateSearchTerm } =
        useElementSearch({
            fetchElements,
        });

    const renderOptionItem = useCallback<
        ElementSearchInputProps<ElementAttributesES>['renderElement']
    >(
        (props) => {
            const { element, inputValue } = props;
            const matchingElement = elementsFound.find(
                (e) => e.id === element.id
            )!;
            return (
                <SearchItem
                    {...props}
                    key={element.id}
                    matchingElement={matchingElement}
                    inputValue={inputValue}
                />
            );
        },
        [elementsFound]
    );

    const updateMapData = useCallback(
        (nodeId: string, children: IDirectory[]) => {
            if (!treeDataRef.current) {
                return;
            }
            let [newRootDirectories, newMapData] = updatedTree(
                treeDataRef.current.rootDirectories,
                treeDataRef.current.mapData,
                nodeId,
                children
            );
            dispatch(
                setTreeData({
                    rootDirectories: newRootDirectories,
                    mapData: newMapData,
                    initialized: true,
                })
            );
        },
        [dispatch]
    );

    const handleDispatchDirectory = useCallback(
        (elementUuidPath: string | undefined) => {
            if (treeDataRef.current && elementUuidPath !== undefined) {
                const selectedDirectory =
                    treeDataRef.current.mapData[elementUuidPath];

                dispatch(setSelectedDirectory(selectedDirectory));
            }
        },
        [dispatch]
    );

    const handleMatchingElement = useCallback<
        ElementSearchInputProps<ElementAttributesES>['onSelectionChange']
    >(
        async (data) => {
            const matchingElement = elementsFound.find(
                (element: ElementAttributesES) => element === data
            );
            if (matchingElement !== undefined) {
                const elementUuidPath = matchingElement?.pathUuid;
                try {
                    for (const uuid of elementUuidPath) {
                        const res = await fetchDirectoryContent(uuid as UUID);
                        updateMapData(
                            uuid,
                            res.filter(
                                (res) => res.type === ElementType.DIRECTORY
                            ) as IDirectory[]
                        );
                    }
                } catch (error: any) {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'pathRetrievingError',
                    });
                }
                const lastElement = elementUuidPath.pop();

                dispatch(setSearchedElement(data));
                if (lastElement !== selectedDirectory?.elementUuid) {
                    handleDispatchDirectory(lastElement);
                }
            }
        },
        [
            selectedDirectory?.elementUuid,
            elementsFound,
            handleDispatchDirectory,
            updateMapData,
            snackError,
            dispatch,
        ]
    );

    return (
        <ElementSearchInput
            sx={{ width: '50%', marginLeft: '14%' }}
            size="small"
            elementsFound={elementsFound}
            getOptionLabel={(element) => element.name}
            isOptionEqualToValue={(element1, element2) =>
                element1.id === element2.id
            }
            onSearchTermChange={updateSearchTerm}
            onSelectionChange={handleMatchingElement}
            renderElement={renderOptionItem}
            searchTerm={searchTerm}
            loading={isLoading}
            renderInput={(value, params) => (
                <SearchBarRenderInput inputRef={inputRef} {...params} />
            )}
        />
    );
};
