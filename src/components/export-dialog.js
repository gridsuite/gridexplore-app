/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import Alert from '@material-ui/lab/Alert';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { getAvailableExportFormats, getExportUrl } from '../utils/rest-api';
import makeStyles from '@material-ui/core/styles/makeStyles';

/**
 * Dialog to export the network case
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the export
 * @param studyName the uuid of the study to export
 * @param {String} title Title of the dialog
 */
const ExportDialog = ({ open, onClose, onClick, studyUuid, title }) => {
    const [availableFormats, setAvailableFormats] = React.useState('');
    const [selectedFormat, setSelectedFormat] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [downloadUrl, setDownloadUrl] = React.useState('');
    const [exportStudyErr, setExportStudyErr] = React.useState('');

    const useStyles = makeStyles(() => ({
        formControl: {
            minWidth: 300,
        },
    }));

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
        setLoading(false);
        onClose();
    };

    const handleExited = () => {
        setExportStudyErr('');
        setSelectedFormat('');
        setLoading(false);
        setDownloadUrl('');
    };

    const handleChange = (event) => {
        let selected = event.target.value;
        setSelectedFormat(selected);
        setDownloadUrl(getExportUrl(studyUuid, selected));
    };

    const classes = useStyles();
    const intl = useIntl();

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            onExited={handleExited}
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
                <Button onClick={handleClose} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
                    <FormattedMessage id="export" />
                </Button>
            </DialogActions>
        </Dialog>
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
