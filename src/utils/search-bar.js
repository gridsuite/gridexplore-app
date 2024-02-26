/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Autocomplete, Box, Stack, TextField } from '@mui/material';
import { searchElementsInfos } from './rest-api';
import {
    getFileIcon,
    useDebounce,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';

const styles = {
    icon: {
        marginRight: 2,
        alignItems: 'center',
        width: '20px',
        height: '20px',
    },
    root: {
        marginLeft: 2,
        alignItems: 'center',
        width: '20px',
        height: '20px',
    },
};
export const SEARCH_FETCH_TIMEOUT_MILLIS = 1000; // 1 second

export const SearchBar = () => {
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const [elementsFound, setElementsFound] = useState([]);
    const lastSearchTermRef = useRef('');
    const [loading, setLoading] = useState(false);
    const treeData = useSelector((state) => state.treeData);
    const treeDataRef = useRef();

    treeDataRef.current = treeData;
    const searchMatchingEquipments = useCallback(
        (searchTerm) => {
            lastSearchTermRef.current = searchTerm;
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
        setLoading(true);
        debouncedSearchMatchingElements(newId);
    };

    useEffect(() => {
        setLoading(false);
    }, [elementsFound]);

    const convertChildren = useCallback((element) => {
        /*        const path = Array.from(
            { length: element.subdirectoriesCount },
            () => '../'
        );*/
        return (
            <Box display="flex" alignItems="center">
                <Box>{getFileIcon(element.type, styles.icon)}</Box>
                <Box>{element.name}</Box>
                <Box
                    sx={{
                        marginLeft: 20,
                        alignItems: 'center',
                        width: '20px',
                        height: '20px',
                    }}
                >
                    ../{element.parentName}
                </Box>
            </Box>
        );
    }, []);

    const renderOptionItem = (props, option) => {
        const matchingElement = elementsFound.find(
            (element) => element.name === option
        );
        return <li {...props}>{convertChildren(matchingElement)}</li>;
    };

    return (
        <Stack spacing={2} sx={{ width: '20%', marginLeft: '17%' }}>
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
                    if (matchingElement) {
                        const selectedParentDir = Object.values(
                            treeData.mapData
                        ).find(
                            (element) =>
                                element.elementUuid === matchingElement.parentId
                        );
                        if (selectedParentDir) {
                            dispatch(setSelectedDirectory(selectedParentDir));
                        }
                    }
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
                        placeholder={'Search (ex.: case name, filter...)'}
                        variant="outlined"
                        fullWidth
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
