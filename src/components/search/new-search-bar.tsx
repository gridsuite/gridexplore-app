/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, Ref, useCallback, useRef } from 'react';
import {
    fetchDirectoryContent,
    searchElementsInfos,
} from '../../utils/rest-api';
import {
    ElementSearchInput,
    ElementType,
    useElementSearch,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory, setTreeData } from '../../redux/actions';
import { updatedTree } from '../tree-views-container';
import { MatchingElementProps, SearchItem } from './search-item';
import {
    IDirectory,
    IElement,
    ITreeData,
    ReduxState,
} from '../../redux/reducer.type';
import { RenderElementProps } from '@gridsuite/commons-ui/dist/components/ElementSearchDialog/element-search-input';
import { TextField } from '@mui/material';
import { useIntl } from 'react-intl';
import { Search } from '@mui/icons-material';

export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

interface SearchBarProps {
    inputRef: Ref<any>;
}

const fetchElements: (
    newSearchTerm: string
) => Promise<MatchingElementProps[]> = searchElementsInfos;

export const SearchBar: FunctionComponent<SearchBarProps> = ({ inputRef }) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const treeData = useSelector((state: ReduxState) => state.treeData);
    const treeDataRef = useRef<ITreeData>();
    const intl = useIntl();
    treeDataRef.current = treeData;

    const { elementsFound, isLoading, searchTerm, updateSearchTerm } =
        useElementSearch({
            fetchElements,
        });

    const renderOptionItem = useCallback(
        (props: RenderElementProps<MatchingElementProps>) => {
            const { element, inputValue } = props;
            const matchingElement = elementsFound.find(
                (e) => e.id === element.id
            )!;
            return (
                <SearchItem
                    {...props}
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

    const handleMatchingElement = useCallback(
        (data: MatchingElementProps) => {
            const matchingElement = elementsFound.find(
                (element: MatchingElementProps) => element === data
            );
            if (matchingElement !== undefined) {
                const elementUuidPath = matchingElement?.pathUuid.reverse();
                const promises = elementUuidPath.map((e: string) => {
                    return fetchDirectoryContent(e)
                        .then((res: IElement[]) => {
                            updateMapData(
                                e,
                                res.filter(
                                    (res) => res.type === ElementType.DIRECTORY
                                ) as IDirectory[]
                            );
                        })
                        .catch((error) =>
                            snackError({
                                messageTxt: error.message,
                                headerId: 'pathRetrievingError',
                            })
                        );
                });

                Promise.all(promises).then(() => {
                    const lastElement = elementUuidPath.pop();
                    handleDispatchDirectory(lastElement);
                });
            }
        },
        [elementsFound, updateMapData, handleDispatchDirectory, snackError]
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
            isLoading={isLoading}
            renderInput={(value, params) => (
                <TextField
                    autoFocus={true}
                    {...params}
                    inputRef={inputRef}
                    placeholder={intl.formatMessage({
                        id: 'searchPlaceholder',
                    })}
                    variant="outlined"
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <>
                                <Search />
                                {params.InputProps.startAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};
