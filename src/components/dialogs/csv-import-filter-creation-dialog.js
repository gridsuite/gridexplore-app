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
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import { DialogContentText } from '@mui/material';

const CsvImportFilterCreationDialog = ({
    onClose,
    open,
    title,
    equipmentType,
    handleValidateCSV,
    tableValues,
}) => {
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const intl = useIntl();
    const { CSVReader } = useCSVReader();
    const [value, setValue] = useState([]);
    const [isConfirmationPopupOpen, setOpenConfirmationPopup] = useState(false);
    const fileHeaders = [
        intl.formatMessage({ id: 'equipmentID' }),
        equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
            ? intl.formatMessage({ id: 'distributionKey' })
            : '',
    ];

    const data = [...[fileHeaders]];

    const csvData = () => {
        let newData = [...data];
        for (let i = 0; i < 10; i++) {
            newData.push([]);
        }
        return newData;
    };

    const handleClose = () => {
        onClose();
        setCreateFilterErr('');
    };

    const validateCsvFile = (rows) => {
        if (rows.length === 0) {
            setCreateFilterErr(intl.formatMessage({ id: 'noDataInCsvFile' }));
            return false;
        }

        // validate the headers
        for (let i = 0; i < fileHeaders.length; i++) {
            if (fileHeaders[i] !== '' && rows[0][i] !== fileHeaders[i]) {
                setCreateFilterErr(
                    intl.formatMessage({ id: 'wrongCsvHeadersError' })
                );
                return false;
            }
        }

        for (let i = 1; i < rows.length; i++) {
            // Check if every row has equipment id
            if (!rows[i][0]) {
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

    const handleCreateFilter = (saveTableValues) => {
        if (value.length !== 0) {
            const result = value.filter((val) => {
                return !!val[0];
            });

            if (validateCsvFile(result)) {
                result.splice(0, 1);
                handleValidateCSV(result, saveTableValues);
                handleClose();
            }
        } else {
            setCreateFilterErr(intl.formatMessage({ id: 'noDataInCsvFile' }));
        }
    };

    const handleOpenCSVConfirmationDataDialog = () => {
        const res = tableValues.filter(
            (d) => !Object.values(d).every((v) => v == null)
        ).length;
        if (res === 0) {
            setOpenConfirmationPopup(false);
            handleCreateFilter(false);
        } else {
            setOpenConfirmationPopup(true);
        }
    };

    const handleAddPopupConfirmation = () => {
        handleCreateFilter(true);
        setOpenConfirmationPopup(false);
    };

    const handleReplacePopupConfirmation = () => {
        handleCreateFilter(false);
        setOpenConfirmationPopup(false);
    };

    const handleCancelDialog = () => {
        setOpenConfirmationPopup(false);
    };
    const renderConfirmationCsvData = () => {
        return (
            <div>
                <Dialog
                    open={isConfirmationPopupOpen}
                    aria-labelledby="dialog-confirmation-csv-data"
                    onKeyPress={() => handleAddPopupConfirmation()}
                >
                    <DialogTitle id={'dialog-confirmation-csv-data'}>
                        {'Confirmation'}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {intl.formatMessage({ id: 'keepCSVDataMessage' })}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => handleCancelDialog()}>
                            <FormattedMessage id="cancel" />
                        </Button>
                        <Button
                            onClick={() => handleReplacePopupConfirmation()}
                        >
                            <FormattedMessage id="replace" />
                        </Button>
                        <Button
                            onClick={() => handleAddPopupConfirmation()}
                            variant="outlined"
                        >
                            <FormattedMessage id="add" />
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    };

    return (
        <>
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
                        onClick={() => handleOpenCSVConfirmationDataDialog()}
                        disabled={createFilterErr !== ''}
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
            {renderConfirmationCsvData()}
        </>
    );
};

CsvImportFilterCreationDialog.prototype = {
    onClose: PropTypes.func,
    open: PropTypes.bool,
    title: PropTypes.string,
    equipmentType: PropTypes.any,
};

export default CsvImportFilterCreationDialog;
