/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import {
    fetchDirectoryContent,
    searchElementsInfos,
} from '../../utils/rest-api';
import { useDebounce, useSnackMessage } from '@gridsuite/commons-ui';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
    setSearchedElement,
    setSelectedDirectory,
    setTreeData,
} from '../../redux/actions';
import { updatedTree } from '../tree-views-container';
import { useIntl } from 'react-intl';
import SearchItem from './search-item';
import { UUID } from 'crypto';
import { ITreeData, ReduxState } from 'redux/reducer.type';
import { ElementInfos } from './search.type';

export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

export const SearchBar = () => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const [elementsFound, setElementsFound] = useState<ElementInfos[]>([]);
    const [inputValue, setInputValue] = useState('');
    const lastSearchTermRef = useRef('');
    const [loading, setLoading] = useState(false);
    const treeData = useSelector((state: ReduxState) => state.treeData);
    const treeDataRef = useRef<ITreeData>();
    const searchInputRef = useRef<HTMLInputElement>();
    const intl = useIntl();
    treeDataRef.current = treeData;
    const searchMatchingEquipments = useCallback(
        (searchTerm: string) => {
            lastSearchTermRef.current = searchTerm;
            searchTerm &&
                searchElementsInfos(searchTerm)
                    .then((infos) => {
                        if (infos.length) {
                            setElementsFound(infos);
                        } else {
                            setElementsFound([]);
                        }
                    })
                    .catch((error) => {
                        snackError({
                            messageTxt: error.message,
                            headerId: 'elementsSearchingError',
                        });
                    });
        },
        [snackError]
    );

    const debouncedSearchMatchingElements = useDebounce(
        searchMatchingEquipments,
        SEARCH_FETCH_TIMEOUT_MILLIS
    );

    const handleChangeInput = useCallback(
        (searchTerm: string) => {
            setInputValue(searchTerm);
            searchTerm && setLoading(true);
            debouncedSearchMatchingElements(searchTerm);
        },
        [debouncedSearchMatchingElements]
    );

    useEffect(() => {
        elementsFound !== undefined && setLoading(false);
    }, [elementsFound]);

    useEffect(() => {
        const openSearch = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', openSearch);
        return () => document.removeEventListener('keydown', openSearch);
    }, []);

    const renderOptionItem = useCallback(
        (props: React.HTMLAttributes<HTMLLIElement>, option: ElementInfos) => {
            const matchingElement = elementsFound.find(
                (element) => element.id === option.id
            );
            return (
                matchingElement && (
                    <SearchItem
                        matchingElement={matchingElement}
                        inputValue={inputValue}
                        {...props}
                    />
                )
            );
        },
        [elementsFound, inputValue]
    );

    const updateMapData = useCallback(
        (nodeId: UUID, children: ElementInfos[]) => {
            let [newRootDirectories, newMapData] = updatedTree(
                treeDataRef.current?.rootDirectories,
                treeDataRef.current?.mapData,
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
        (elementUuidPath: UUID) => {
            const selectedDirectory =
                treeDataRef.current?.mapData[elementUuidPath];

            dispatch(setSelectedDirectory(selectedDirectory));
        },
        [dispatch]
    );

    const handleMatchingElement = useCallback(
        (data: ElementInfos | null) => {
            if (data == null) {
                return;
            }

            const matchingElement = elementsFound.find(
                (element) => element.id === data.id
            );
            if (matchingElement !== undefined) {
                const elementUuidPath = matchingElement?.pathUuid.reverse();

                const promises = elementUuidPath.map((e) => {
                    return fetchDirectoryContent(e)
                        .then((res) => {
                            updateMapData(e, res);
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
                    if (lastElement) {
                        handleDispatchDirectory(lastElement);
                        dispatch(setSearchedElement(data));
                    }
                });
            }
        },
        [
            elementsFound,
            updateMapData,
            handleDispatchDirectory,
            snackError,
            dispatch,
        ]
    );

    return (
        <Autocomplete
            sx={{ width: '50%', marginLeft: '14%' }}
            size="small"
            disableClearable={false}
            forcePopupIcon={false}
            clearOnBlur
            autoHighlight={true}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={inputValue}
            onInputChange={(_, data) => handleChangeInput(data)}
            onChange={(_, data) => handleMatchingElement(data)}
            options={loading ? [] : elementsFound}
            getOptionLabel={(option) => option.name}
            loading={loading}
            renderOption={renderOptionItem}
            renderInput={(params) => (
                <TextField
                    autoFocus={true}
                    {...params}
                    inputRef={searchInputRef}
                    placeholder={intl.formatMessage({
                        id: 'searchPlaceholder',
                    })}
                    variant="outlined"
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <React.Fragment>
                                <Search />
                                {params.InputProps.startAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
};

export default SearchBar;
