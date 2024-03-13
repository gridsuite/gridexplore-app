/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Autocomplete, Stack, TextField } from '@mui/material';
import { searchElementsInfos } from './rest-api';
import {
    getFileIcon,
    useDebounce,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';
import Grid from '@mui/material/Grid';

const styles = {
    icon: (theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
    grid: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    grid2: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        color: 'grey',
    },
};
export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

export const SearchBar = ({ inputRef }) => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const [elementsFound, setElementsFound] = useState([]);
    const [selectedParentDir, setSelectedParentDir] = useState(true);
    const [selectedElementDir, setSelectedElementDir] = useState(true);
    const [processingDispatch, setProcessingDispatch] = useState(false);
    const lastSearchTermRef = useRef('');
    const [loading, setLoading] = useState(false);
    const treeData = useSelector((state) => state.treeData);
    const treeDataRef = useRef();
    const currentChildren = useSelector((state) => state.currentChildren);
    const currentChildrenRef = useRef(currentChildren);
    currentChildrenRef.current = currentChildren;

    treeDataRef.current = treeData;
    const searchMatchingEquipments = useCallback(
        (searchTerm) => {
            lastSearchTermRef.current = searchTerm;
            searchTerm &&
                searchElementsInfos(searchTerm)
                    .then((infos) => {
                        setElementsFound(infos);
                    })
                    .catch((error) => {
                        snackError({
                            messageTxt: error.message,
                            headerId: 'equipmentsSearchingError',
                        });
                    });
        },
        [snackError]
    );

    const debouncedSearchMatchingElements = useDebounce(
        searchMatchingEquipments,
        SEARCH_FETCH_TIMEOUT_MILLIS
    );

    const handleChangeInput = (newId) => {
        newId && setLoading(true);
        debouncedSearchMatchingElements(newId);
    };

    useEffect(() => {
        setLoading(false);
    }, [elementsFound]);

    const convertChildren = useCallback((element) => {
        return (
            <>
                <span>{getFileIcon(element.type, styles.icon)}</span>
                <Grid container>
                    <Grid item xs={11} sx={styles.grid}>
                        {element.name}
                    </Grid>
                    <Grid item sx={styles.grid2}>
                        {element.path
                            .map((path, index) =>
                                index > 0 ? path.elementName + '/' : ''
                            )
                            .join('')}
                    </Grid>
                </Grid>
            </>
        );
    }, []);

    const renderOptionItem = (props, option) => {
        const matchingElement = elementsFound.find(
            (element) => element.name === option
        );
        return <li {...props}>{convertChildren(matchingElement)}</li>;
    };

    const handleDispatchDirectory = useCallback(
        (elementUuid) => {
            const selectedDirectory = treeDataRef.current.mapData[elementUuid];
            dispatch(setSelectedDirectory(selectedDirectory));
        },
        [dispatch]
    );

    const handleMatchingElement = useCallback(
        (matchingElement) => {
            if (matchingElement) {
                const elementUuidPath = matchingElement.path
                    .slice(1) // Skip the first element*!/
                    .map((e) => e.elementUuid)
                    .reverse();

                const [rootUuid, parentUuid, elementUuid] = elementUuidPath;

                handleDispatchDirectory(rootUuid);

                setSelectedParentDir(parentUuid);
                setProcessingDispatch(true);
                setSelectedElementDir(elementUuid);
            }
        },
        [setSelectedParentDir, handleDispatchDirectory]
    );

    useEffect(() => {
        if (processingDispatch && selectedParentDir) {
            handleDispatchDirectory(selectedParentDir);
            setProcessingDispatch(false);
        } else if (selectedElementDir) {
            handleDispatchDirectory(selectedElementDir);
            setProcessingDispatch(false);
        }
    }, [
        processingDispatch,
        handleDispatchDirectory,
        selectedParentDir,
        selectedElementDir,
    ]);

    return (
        <Stack sx={{ width: '50%', marginLeft: '14%' }}>
            <Autocomplete
                freeSolo
                size="small"
                disableClearable={false}
                forcePopupIcon={false}
                clearOnBlur
                onInputChange={(_, data) => handleChangeInput(data)}
                onChange={(event, data) => {
                    const matchingElement = elementsFound.find(
                        (element) => element.name === data
                    );
                    handleMatchingElement(matchingElement);
                }}
                options={
                    loading ? [] : elementsFound.map((option) => option.name)
                }
                loading={loading}
                renderOption={(props, option) =>
                    renderOptionItem(props, option)
                }
                renderInput={(params) => (
                    <TextField
                        autoFocus={true}
                        {...params}
                        inputRef={inputRef}
                        placeholder={'Search (ex.: case name, filter...)'}
                        variant="outlined"
                        InputProps={{
                            ...params.InputProps,
                            type: 'search',
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
        </Stack>
    );
};

export default SearchBar;
