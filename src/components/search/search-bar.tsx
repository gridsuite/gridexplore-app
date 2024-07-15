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
    ElementAttributesES,
    IDirectory,
    ITreeData,
    PageableElementsAttributesES,
    ReduxState,
} from '../../redux/reducer.type';
import { RenderElementProps } from '@gridsuite/commons-ui/dist/components/ElementSearchDialog/element-search-input';
import { Paper, TextFieldProps, Typography } from '@mui/material';
import { SearchBarRenderInput } from './search-bar-render-input';
import { UUID } from 'crypto';
import { useTheme } from '@mui/material';
import { useIntl } from 'react-intl';

export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

interface SearchBarProps {
    inputRef: RefObject<TextFieldProps>;
}

const fetchElementsPageable: (
    newSearchTerm: string
) => Promise<PageableElementsAttributesES> = searchElementsInfos;

export const SearchBar: FunctionComponent<SearchBarProps> = ({ inputRef }) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const treeData = useSelector((state: ReduxState) => state.treeData);
    const theme = useTheme();
    const intl = useIntl();
    const treeDataRef = useRef<ITreeData>();
    const selectedDirectory = useSelector(
        (state: ReduxState) => state.selectedDirectory
    );
    treeDataRef.current = treeData;

    const fetchElementsPageable: (
        newSearchTerm: string
    ) => Promise<PageableElementsAttributesES> = useCallback(
        (newSearchTerm) =>
            searchElementsInfos(newSearchTerm, selectedDirectory?.elementUuid),
        [selectedDirectory?.elementUuid]
    );
    const {
        elementsFound,
        isLoading,
        searchTerm,
        updateSearchTerm,
        totalElements,
    } = useElementSearch({
        fetchElements: fetchElementsPageable,
    });

    const renderOptionItem = useCallback(
        (props: RenderElementProps<ElementAttributesES>) => {
            const { element, inputValue } = props;

            const matchingElement: ElementAttributesES = elementsFound.find(
                (e: ElementAttributesES) => e.id === element.id
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
        async (data: ElementAttributesES | string | null) => {
            const matchingElement: ElementAttributesES | undefined =
                elementsFound.find((element) => element === data);
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
            handleDispatchDirectory,
            updateMapData,
            snackError,
            dispatch,
            elementsFound,
        ]
    );

    return (
        <ElementSearchInput
            sx={{ width: '50%', marginLeft: '14%' }}
            size="small"
            elementsFound={elementsFound as ElementAttributesES[]}
            getOptionLabel={(element: ElementAttributesES) => element.name}
            isOptionEqualToValue={(
                element1: ElementAttributesES,
                element2: ElementAttributesES
            ) => element1.id === element2.id}
            onSearchTermChange={updateSearchTerm}
            onSelectionChange={handleMatchingElement}
            renderElement={renderOptionItem}
            searchTerm={searchTerm}
            loading={isLoading}
            renderInput={(_value: any, params) => (
                <SearchBarRenderInput inputRef={inputRef} {...params} />
            )}
            PaperComponent={({
                children,
                ...other
            }: {
                children: React.ReactNode;
            }) => {
                return (
                    <Paper {...other}>
                        <Typography
                            variant="body1"
                            style={{
                                color: theme.palette.info.main,
                                marginTop: theme.spacing(1),
                                marginBottom: theme.spacing(1),
                                marginLeft: theme.spacing(2),
                            }}
                        >
                            {intl
                                .formatMessage(
                                    { id: 'showingSearchResults' },
                                    {
                                        nbElementsShown:
                                            elementsFound.length as number,
                                        nbElementsTotal: totalElements,
                                    }
                                )
                                .toString()}
                        </Typography>
                        {children}
                    </Paper>
                );
            }}
        />
    );
};
