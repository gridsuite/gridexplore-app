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
import {
    getFileIcon,
    useDebounce,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory, setTreeData } from '../../redux/actions';
import Grid from '@mui/material/Grid';
import { updatedTree } from '../tree-views-container';
import Typography from '@mui/material/Typography';
import { FormattedMessage, useIntl } from 'react-intl';

const styles = {
    icon: (theme) => ({
        marginRight: theme.spacing(2),
        width: '18px',
        height: '18px',
    }),
    grid: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    grid2: (theme) => ({
        marginRight: theme.spacing(2),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        color: 'grey',
    }),
};
export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

export const SearchBar = ({ inputRef }) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const [elementsFound, setElementsFound] = useState([]);
    const [inputValue, onInputChange] = useState('');
    const lastSearchTermRef = useRef('');
    const [loading, setLoading] = useState(false);
    const treeData = useSelector((state) => state.treeData);
    const treeDataRef = useRef();
    const intl = useIntl();
    treeDataRef.current = treeData;
    const searchMatchingEquipments = useCallback(
        (searchTerm) => {
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
        (searchTerm) => {
            onInputChange(searchTerm);
            searchTerm && setLoading(true);
            debouncedSearchMatchingElements(searchTerm);
        },
        [debouncedSearchMatchingElements]
    );

    useEffect(() => {
        elementsFound !== undefined && setLoading(false);
    }, [elementsFound]);

    const renderElement = useCallback((element) => {
        return (
            <>
                <span>{getFileIcon(element.type, styles.icon)}</span>
                <Grid container>
                    <Grid item xs={11} sx={styles.grid}>
                        {element.name}
                    </Grid>
                    <Grid item sx={styles.grid2}>
                        <Typography>
                            <FormattedMessage id="path" />
                            {element.pathName?.join(' / ')}
                        </Typography>
                    </Grid>
                </Grid>
            </>
        );
    }, []);

    const renderOptionItem = useCallback(
        (props, option) => {
            const matchingElement = elementsFound.find(
                (element) => element.id === option.id
            );
            return <li {...props}>{renderElement(matchingElement)}</li>;
        },
        [elementsFound, renderElement]
    );

    const updateMapData = useCallback(
        (nodeId, children) => {
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
        (elementUuidPath) => {
            const selectedDirectory =
                treeDataRef.current.mapData[elementUuidPath];

            dispatch(setSelectedDirectory(selectedDirectory));
        },
        [dispatch]
    );

    const handleMatchingElement = useCallback(
        (matchingElement) => {
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
                    handleDispatchDirectory(lastElement);
                });
            }
        },
        [updateMapData, handleDispatchDirectory, snackError]
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
                inputValue={inputValue}
                onInputChange={(_, data) => handleChangeInput(data)}
                onChange={(event, data) => {
                    const matchingElement = elementsFound.find(
                        (element) => element === data
                    );
                    handleMatchingElement(matchingElement);
                }}
                key={(option) => option.id}
                options={loading ? [] : elementsFound}
                getOptionLabel={(option) => option.name}
                loading={loading}
                renderOption={(props, option) =>
                    renderOptionItem(props, option)
                }
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
                                <React.Fragment>
                                    <Search />
                                    {params.InputProps.startAdornment}
                                </React.Fragment>
                            ),
                        }}
                    />
                )}
            />
        </>
    );
};

export default SearchBar;
