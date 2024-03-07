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
            <Grid container>
                <Grid item xs={1}>
                    {getFileIcon(element.type, styles.icon)}
                </Grid>
                <Grid item xs={8} sx={styles.grid}>
                    {element.name}
                </Grid>
                <Grid item xs={8} sx={styles.grid}>
                    {element.path
                        .map((path, index) =>
                            index > 0 ? '/' + path.elementName : ''
                        )
                        .join('')}
                </Grid>
            </Grid>
        ); /**/
    }, []);

    const renderOptionItem = (props, option) => {
        const matchingElement = elementsFound.find(
            (element) => element.name === option
        );
        return <li {...props}>{convertChildren(matchingElement)}</li>;
    };

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
                    const matchingElement = elementsFound.find((element) =>
                        element.path.map((p, index) =>
                            index > 0 ? p.elementName === data : ''
                        )
                    );

                    console.log(matchingElement);
                    console.log(treeData);
                    let testDir1 = matchingElement.path[2].elementUuid;
                    const selectedParentDir1 = Object.values(
                        treeData.mapData
                    ).find((element) => element.elementUuid === testDir1);
                    dispatch(setSelectedDirectory(selectedParentDir1));

                    let testDir = matchingElement.path[1].elementUuid;
                    const selectedParentDir = Object.values(
                        treeData.mapData
                    ).find((element) => element.elementUuid === testDir);
                    dispatch(setSelectedDirectory(selectedParentDir));
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
