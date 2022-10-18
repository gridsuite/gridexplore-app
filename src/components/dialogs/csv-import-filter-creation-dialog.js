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
import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { FormattedMessage, useIntl } from 'react-intl';
import CsvDownloader from 'react-csv-downloader';
import { createFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import { equipmentsDefinition } from './generic-filter-dialog';
import PropTypes from 'prop-types';

const CsvImportFilterCreationDialog = ({
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

    const data = [
        [
            intl.formatMessage({ id: 'equipmentID' }),
            intl.formatMessage({ id: 'equipmentType' }),
            intl.formatMessage({ id: 'distributionKey' }),
        ],
    ];

    const csvData = () => {
        let newData = [...data];
        for (let i = 0; i < 10; i++) {
            newData = [...newData, ...[[]]];
        }
        newData = [
            ...newData,
            ...[
                [
                    intl.formatMessage({ id: 'CSVFileComment' }),
                    equipmentsDefinition.LINE.type,
                ],
            ],
        ];
        Object.entries(equipmentsDefinition)
            .filter((val) => val.label !== equipmentsDefinition.LINE.label)
            .forEach((value) => {
                newData = [...newData, ...[['', value[0]]]];
            });
        return newData;
    };

    const resetDialog = () => {
        setValue([]);
        setCreateFilterErr('');
    };

    const handleClose = () => {
        onClose();
        resetDialog();
    };

    const validateCsvFile = (rows, equipmentType) => {
        console.log('results : ', rows);
        for (let i = 0; i < rows.length; i++) {
            console.log('here 1', rows[i]);

            // Check if equipment type is specified in the row
            if (!rows[i][1]) {
                setCreateFilterErr(
                    intl.formatMessage({
                        id: 'noEquipmentTypeFoundInCSVError',
                    })
                );
                return false;
            }

            if (!equipmentType) {
                equipmentType = rows[i][1];
            }

            // Check if multiple equipment type are specified
            if (rows[i][1] !== equipmentType) {
                setCreateFilterErr(
                    intl.formatMessage({
                        id: 'multipleEquipmentTypeError',
                    })
                );
                return false;
            }
        }
        return true;
    };

    const getEquipmentsAttributes = (rows, equipmentType) => {
        let isEquipmentWithDK = !rows.every((row) => !row[2]);
        return rows.map((val, idx) => {
            let dKey;

            // if the equipment is generator or load and the distribution key is set in one row,
            // the other distribution keys in other rows will be set to 0 if it is null
            if (
                equipmentType === equipmentsDefinition.GENERATOR.type ||
                equipmentType === equipmentsDefinition.LOAD.type
            ) {
                if (isEquipmentWithDK && !val[2]) dKey = 0;
                if (isEquipmentWithDK && val[2]) dKey = val[2];
            }

            return {
                equipmentID: val[0],
                distributionKey: dKey,
            };
        });
    };

    useEffect(() => {
        console.log('createFilterErr : ', createFilterErr);
    }, [createFilterErr]);

    const handleCreateFilter = () => {
        if (value.length !== 0) {
            value.splice(0, 1);
            let equipmentType = '';
            let csvCommentStart = false;
            const result = value.filter((val) => {
                if (val[0].startsWith('#')) csvCommentStart = true;
                return !csvCommentStart && !!val[0];
            });

            if (validateCsvFile(result, equipmentType)) {
                equipmentType = result[0][1];
                createFilter(
                    {
                        type: FilterType.MANUAL,
                        equipmentType: equipmentType,
                        filterEquipmentsAttributes: getEquipmentsAttributes(
                            result,
                            equipmentType
                        ),
                    },
                    name,
                    activeDirectory
                )
                    .then(() => {
                        handleClose();
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
                        <Grid xs={5}>
                            <CsvDownloader
                                datas={csvData()}
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
                                    <Grid item>
                                        <Button {...getRootProps()}>
                                            <FormattedMessage id="UploadCSV" />
                                        </Button>
                                        <span
                                            style={{
                                                marginLeft: '10px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {acceptedFile
                                                ? acceptedFile.name
                                                : ''}
                                        </span>
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
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button variant="outlined" onClick={handleCreateFilter}>
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CsvImportFilterCreationDialog.prototype = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    title: PropTypes.string,
    customTextCancelBtn: PropTypes.string,
    customTextValidationBtn: PropTypes.string,
};

export default CsvImportFilterCreationDialog;
