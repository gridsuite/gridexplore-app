/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Fragment,
    FunctionComponent,
    Ref,
    SyntheticEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Autocomplete, TextField } from '@mui/material';
import {
    fetchDirectoryContent,
    searchElementsInfos,
} from '../../utils/rest-api';
import {
    ElementType,
    useDebounce,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory, setTreeData } from '../../redux/actions';
import { updatedTree } from '../tree-views-container';
import { useIntl } from 'react-intl';
import { SearchItem } from './search-item';
import {
    IDirectory,
    IElement,
    ITreeData,
    ReduxState,
} from '../../redux/reducer.type';

export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

interface matchingElementProps {
    id: string;
    name: string;
    type: string;
    pathName: string[];
    pathUuid: string[];
}

interface SearchBarProps {
    inputRef: Ref<any>;
}

export const SearchBar: FunctionComponent<SearchBarProps> = ({ inputRef }) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const [elementsFound, setElementsFound] = useState<matchingElementProps[]>(
        []
    );
    const [inputValue, onInputChange] = useState('');
    const lastSearchTermRef = useRef('');
    const [loading, setLoading] = useState(false);
    const treeData = useSelector((state: ReduxState) => state.treeData);
    const treeDataRef = useRef<ITreeData>();
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
            onInputChange(searchTerm);
            searchTerm && setLoading(true);
            debouncedSearchMatchingElements(searchTerm);
        },
        [debouncedSearchMatchingElements]
    );

    useEffect(() => {
        elementsFound !== undefined && setLoading(false);
    }, [elementsFound]);

    const renderOptionItem = useCallback(
        (props: any, option: matchingElementProps) => {
            const matchingElement = elementsFound.find(
                (element: matchingElementProps) => element.id === option.id
            );
            return (
                <SearchItem
                    matchingElement={matchingElement}
                    inputValue={inputValue}
                    {...props}
                />
            );
        },
        [elementsFound, inputValue]
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
        (event: SyntheticEvent, data: matchingElementProps | string | null) => {
            const matchingElement = elementsFound.find(
                (element: matchingElementProps) => element === data
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
        <>
            <Autocomplete
                sx={{ width: '50%', marginLeft: '14%' }}
                freeSolo
                size="small"
                disableClearable={false}
                forcePopupIcon={false}
                clearOnBlur
                autoHighlight={true}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                inputValue={inputValue}
                onInputChange={(_, data) => handleChangeInput(data)}
                onChange={handleMatchingElement}
                getOptionKey={(option) => {
                    if (typeof option === 'string') {
                        return option;
                    } else {
                        return option.id;
                    }
                }}
                options={loading ? [] : elementsFound}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                        return inputValue;
                    } else {
                        return option.name;
                    }
                }}
                loading={loading}
                renderOption={renderOptionItem}
                renderInput={(params) => (
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
                                <Fragment>
                                    <Search />
                                    {params.InputProps.startAdornment}
                                </Fragment>
                            ),
                        }}
                    />
                )}
            />
        </>
    );
};
