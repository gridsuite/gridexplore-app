/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useCSVReader } from 'react-papaparse';
import Button from '@mui/material/Button';
import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { FormattedMessage, useIntl } from 'react-intl';
import TextField from '@mui/material/TextField';
import CsvDownloader from 'react-csv-downloader';
import { createFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import { equipmentsDefinition } from './generic-filter-dialog';
import PropTypes from 'prop-types';

const CsvImportFilterCreation = ({
    id,
    label,
    name,
    onClose,
    open,
    title,
    customTextCancelBtn,
    customTextValidationBtn,
    setFilterCreationType,
}) => {
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const intl = useIntl();
    const { CSVReader } = useCSVReader();
    const [value, setValue] = useState([]);
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const getSupportedEquipmentComment = () => {
        const equipmentType = Object.entries(equipmentsDefinition).map(
            ([key, value]) => {
                return value.type;
            }
        );
        return [...['# Supported Equipments Types : '], ...equipmentType];
    };

    const data = [
        [getSupportedEquipmentComment()],
        [
            '#' + intl.formatMessage({ id: 'equipmentID' }),
            intl.formatMessage({ id: 'equipmentType' }),
            intl.formatMessage({ id: 'distributionKey' }),
        ],
    ];

    const resetDialog = () => {
        setValue([]);
        setCreateFilterErr('');
        setFilterCreationType(FilterType.AUTOMATIC);
    };

    const handleClose = () => {
        resetDialog();
    };

    const handleCreateFilter = () => {
        if (value.length !== 0) {
            value.splice(0, 1);
            let equipmentType = '';
            const result = value
                .filter((val) => !val[0].startsWith('#') && !!val[0])
                .map((val, idx) => {
                    if (
                        equipmentType &&
                        val[1] &&
                        val[1] !== equipmentType &&
                        !createFilterErr
                    ) {
                        setCreateFilterErr(
                            intl.formatMessage({
                                id: 'multipleEquipmentTypeError',
                            })
                        );
                    }

                    if (!equipmentType) {
                        equipmentType = val[1];
                    }

                    return {
                        equipmentId: val[0],
                        distributionKey: val[2],
                    };
                });

            if (!createFilterErr) {
                createFilter(
                    {
                        type: FilterType.MANUAL,
                        equipmentType: equipmentType,
                        filterEquipmentsAttributes: result,
                    },
                    name,
                    activeDirectory
                )
                    .then(() => {
                        setFilterCreationType(FilterType.AUTOMATIC);
                        resetDialog();
                    })
                    .catch((message) => {
                        setCreateFilterErr(message);
                    });
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <DialogTitle>
                <Grid xs={12} container justifyContent={'space-between'}>
                    <Grid item xs={12}>
                        {title}
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent>
                <div>
                    <Grid container>
                        <Grid xs={6}>
                            <CsvDownloader
                                datas={data}
                                filename={'filter creation'}
                            >
                                <Button>
                                    <FormattedMessage id="GenerateCSV" />
                                </Button>
                            </CsvDownloader>
                        </Grid>
                    </Grid>
                    <Grid container spacing={3}>
                        <CSVReader
                            onUploadAccepted={(results) => {
                                setValue([...results.data]);
                                setCreateFilterErr('');
                            }}
                        >
                            {({ getRootProps, acceptedFile }) => (
                                <>
                                    <Grid xs={4} item>
                                        <Button {...getRootProps()}>
                                            <FormattedMessage id="UploadCSV" />
                                        </Button>
                                    </Grid>
                                    <Grid xs={8} item>
                                        <TextField
                                            label={
                                                <FormattedMessage id="CsvFileName" />
                                            }
                                            InputProps={{ readOnly: true }}
                                            value={
                                                acceptedFile
                                                    ? acceptedFile.name
                                                    : ''
                                            }
                                        />
                                    </Grid>
                                </>
                            )}
                        </CSVReader>
                    </Grid>

                    {createFilterErr !== '' && (
                        <Alert severity="error">{createFilterErr}</Alert>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{customTextCancelBtn}</Button>
                <Button variant="outlined" onClick={handleCreateFilter}>
                    {customTextValidationBtn}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CsvImportFilterCreation.prototype = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    title: PropTypes.string,
    customTextCancelBtn: PropTypes.string,
    customTextValidationBtn: PropTypes.string,
};

export default CsvImportFilterCreation;
