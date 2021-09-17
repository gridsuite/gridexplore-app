/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Grid from '@material-ui/core/Grid';

/**
 * Dialog to delete an element
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the deletion
 * @param {Array} items Items for deletion confirmation
 * @param {String} multipleDeleteFormatMessageId Format message id for multiple delete
 * @param {String} simpleDeleteFormatMessageId Format message id for simple delete
 * @param {String} error Error message
 */
const DeleteDialog = ({
    open,
    onClose,
    onClick,
    items,
    multipleDeleteFormatMessageId,
    simpleDeleteFormatMessageId,
    error,
}) => {
    const intl = useIntl();

    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        console.debug('Request for deletion');
        onClick();
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClose();
        }
    };

    const buildTitle = (items) => {
        return items.length === 1
            ? intl.formatMessage(
                  { id: 'deleteItemDialogTitle' },
                  {
                      itemName: items[0].elementName,
                  }
              )
            : intl.formatMessage(
                  { id: 'deleteMultipleItemsDialogTitle' },
                  { itemsCount: items.length }
              );
    };

    const buildItemsToDeleteGrid = (
        items,
        multipleDeleteFormatMessageId,
        simpleDeleteFormatMessageId
    ) => {
        return (
            items &&
            (items.length > 1 ? (
                <Grid>
                    <Grid item>
                        <span>
                            {intl.formatMessage(
                                {
                                    id: multipleDeleteFormatMessageId,
                                },
                                { itemsCount: items.length }
                            )}
                        </span>
                    </Grid>
                    {items.slice(0, 10).map((file) => (
                        <Grid item>
                            <span> {file.elementName} </span>
                        </Grid>
                    ))}
                    {items.length > 10 && (
                        <Grid item>
                            <span>
                                {intl.formatMessage(
                                    {
                                        id: 'additionalItems',
                                    },
                                    { itemsCount: items.length - 10 }
                                )}
                            </span>
                        </Grid>
                    )}
                </Grid>
            ) : (
                <Grid>
                    <Grid item>
                        <span>
                            {intl.formatMessage(
                                {
                                    id: simpleDeleteFormatMessageId,
                                },
                                {
                                    itemName: (
                                        <span style={{ fontWeight: 'bold' }}>
                                            {items.length === 1 &&
                                                items[0].elementName}
                                        </span>
                                    ),
                                }
                            )}
                        </span>
                    </Grid>
                </Grid>
            ))
        );
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-delete"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{buildTitle(items)}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {buildItemsToDeleteGrid(
                        items,
                        multipleDeleteFormatMessageId,
                        simpleDeleteFormatMessageId
                    )}
                </DialogContentText>
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="text">
                    <FormattedMessage id="delete" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
    multipleDeleteFormatMessageId: PropTypes.string.isRequired,
    simpleDeleteFormatMessageId: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
};

export default DeleteDialog;
