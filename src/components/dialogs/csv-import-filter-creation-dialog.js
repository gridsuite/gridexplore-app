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
import CsvDownloader from 'react-csv-downloader';
import { createFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import { equipmentsDefinition } from './generic-filter-dialog';
import PropTypes from 'prop-types';

const CsvImportFilterCreationDialog = ({ name, onClose, open, title }) => {
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const intl = useIntl();
    const { CSVReader } = useCSVReader();
    const [value, setValue] = useState([]);
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const fileHeaders = [
        intl.formatMessage({ id: 'equipmentType' }),
        intl.formatMessage({ id: 'equipmentID' }),
        intl.formatMessage({ id: 'distributionKey' }),
    ];

    const data = [...[fileHeaders]];

    const csvData = () => {
        let newData = [...data];
        for (let i = 0; i < 10; i++) {
            newData.push([]);
        }
        newData.push([
            intl.formatMessage({ id: 'CSVFileComment' }),
            equipmentsDefinition.LINE.type,
        ]);
        Object.entries(equipmentsDefinition)
            .filter((val) => val[0] !== equipmentsDefinition.LINE.type)
            .forEach((value) => {
                newData.push(['', value[0]]);
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
        if (rows.length === 0) {
            setCreateFilterErr(intl.formatMessage({ id: 'noDataInCsvFile' }));
            return false;
        }

        // validate the headers
        for (let i = 0; i < 3; i++) {
            if (rows[0][i] !== fileHeaders[i]) {
                setCreateFilterErr(
                    intl.formatMessage({ id: 'wrongCsvHeadersError' })
                );
                return false;
            }
        }

        for (let i = 1; i < rows.length; i++) {
            // Check if equipment type is specified in the row
            if (!rows[i][0]) {
                setCreateFilterErr(
                    intl.formatMessage({
                        id: 'noEquipmentTypeFoundInCSVError',
                    })
                );
                return false;
            }

            if (!equipmentType) {
                equipmentType = rows[i][0];
            }

            // Check if multiple equipment type are specified
            if (rows[i][0] !== equipmentType) {
                setCreateFilterErr(
                    intl.formatMessage({
                        id: 'multipleEquipmentTypeError',
                    })
                );
                return false;
            }

            // Check if every row has equipment id
            if (!rows[i][1]) {
                setCreateFilterErr(
                    intl.formatMessage({
                        id: 'missingEquipmentsIdsError',
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
                equipmentID: val[1].trim(),
                distributionKey: dKey,
            };
        });
    };

    const handleCreateFilter = () => {
        if (value.length !== 0) {
            let equipmentType = '';
            let csvCommentStart = false;
            const result = value.filter((val) => {
                if (val[0].startsWith('#')) csvCommentStart = true;
                return !csvCommentStart && !!val[0] && !!val[1];
            });

            if (validateCsvFile(result, equipmentType)) {
                result.splice(0, 1);
                equipmentType = result[0][0].trim();
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
                    })
                    .catch((message) => {
                        setCreateFilterErr(message);
                    });
            }
        } else {
            setCreateFilterErr(intl.formatMessage({ id: 'noDataInCsvFile' }));
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <div>
                    <Grid container spacing={2}>
                        <Grid container item>
                            <Grid item xs={6}>
                                <CsvDownloader
                                    datas={csvData()}
                                    filename={'filterCreation'}
                                >
                                    <Button variant={'contained'}>
                                        <FormattedMessage id="GenerateCSV" />
                                    </Button>
                                </CsvDownloader>
                            </Grid>
                        </Grid>
                        <Grid container item spacing={3}>
                            <CSVReader
                                onUploadAccepted={(results) => {
                                    setValue([...results.data]);
                                    setCreateFilterErr('');
                                }}
                            >
                                {({ getRootProps, acceptedFile }) => (
                                    <>
                                        <Grid item>
                                            <Button
                                                {...getRootProps()}
                                                variant={'contained'}
                                            >
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
                                                    : intl.formatMessage({
                                                          id: 'uploadMessage',
                                                      })}
                                            </span>
                                        </Grid>
                                    </>
                                )}
                            </CSVReader>
                        </Grid>
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
                <Button
                    variant="outlined"
                    onClick={handleCreateFilter}
                    disabled={createFilterErr !== ''}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CsvImportFilterCreationDialog.prototype = {
    name: PropTypes.string,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    title: PropTypes.string,
};

export default CsvImportFilterCreationDialog;
