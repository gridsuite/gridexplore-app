/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ContextualMenuDialog } from './contextual-menu-dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { getAvailableExportFormats, getExportUrl } from '../../utils/rest-api';
import makeStyles from '@mui/styles/makeStyles';

/**
 * Dialog to export the network case
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the export
 * @param {String} studyUuid the uuid of the study to export
 * @param {String} title Title of the dialog
 */

const useStyles = makeStyles(() => ({
    formControl: {
        minWidth: 300,
    },
}));

const ExportDialog = ({ open, onClose, onClick, studyUuid, title }) => {
    const [availableFormats, setAvailableFormats] = React.useState('');
    const [selectedFormat, setSelectedFormat] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [downloadUrl, setDownloadUrl] = React.useState('');
    const [exportStudyErr, setExportStudyErr] = React.useState('');

    useEffect(() => {
        if (open) {
            getAvailableExportFormats().then((formats) => {
                setAvailableFormats(formats);
            });
        }
    }, [open]);

    const handleClick = () => {
        console.debug('Request for exporting in format: ' + selectedFormat);
        if (selectedFormat) {
            setLoading(true);
            onClick(downloadUrl);
        } else {
            setExportStudyErr(
                intl.formatMessage({ id: 'exportStudyErrorMsg' })
            );
        }
    };

    const handleClose = () => {
        setExportStudyErr('');
        setSelectedFormat('');
        setLoading(false);
        setDownloadUrl('');
        onClose();
    };

    const handleChange = (event) => {
        let selected = event.target.value;
        setSelectedFormat(selected);
        setDownloadUrl(getExportUrl(studyUuid, selected));
    };

    const classes = useStyles();
    const intl = useIntl();

    return (
        <ContextualMenuDialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-export"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <FormControl className={classes.formControl}>
                    <InputLabel id="select-format-label">
                        <FormattedMessage id="exportFormat" />
                    </InputLabel>
                    <Select
                        labelId="select-format-label"
                        id="controlled-select-format"
                        onChange={handleChange}
                        defaultValue=""
                        inputProps={{
                            id: 'select-format',
                        }}
                    >
                        {availableFormats !== '' &&
                            availableFormats.map(function (element) {
                                return (
                                    <MenuItem key={element} value={element}>
                                        {element}
                                    </MenuItem>
                                );
                            })}
                    </Select>
                </FormControl>
                {exportStudyErr !== '' && (
                    <Alert severity="error">{exportStudyErr}</Alert>
                )}
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '5px',
                        }}
                    >
                        <CircularProgress />
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
                    <FormattedMessage id="export" />
                </Button>
            </DialogActions>
        </ContextualMenuDialog>
    );
};

ExportDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    studyUuid: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ExportDialog;
