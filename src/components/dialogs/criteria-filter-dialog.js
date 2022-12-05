/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { saveFilter, saveFormContingencyList } from '../../utils/rest-api';
import { ElementType } from '../../utils/elementType';
import CriteriaFilterDialogContent from './criteria-filter-dialog-content';

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '705px',
        minHeight: '500px',
        margin: 'auto',
    },
}));

export const CriteriaBasedFilterDialog = ({
    id,
    open,
    onClose,
    onError,
    title,
    contentType,
    isFilterCreation,
    handleFilterCreation,
}) => {
    const [initialFilter, setInitialFilter] = useState(null);
    const currentFilter = useRef(null);
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const classes = useStyles();
    const openRef = useRef(null);
    openRef.current = open;

    useEffect(() => {
        if (initialFilter !== null) {
            setBtnSaveListDisabled(initialFilter.transient !== true);
        }
    }, [initialFilter]);

    const handleEditCallback = (filter) => {
        if (contentType === ElementType.CONTINGENCY_LIST) {
            currentFilter.current = {};
            currentFilter.current.id = filter.id;
            currentFilter.current.equipmentType =
                filter.equipmentFilterForm.equipmentType;
            currentFilter.current.countries1 =
                filter.equipmentFilterForm.countries1;
            currentFilter.current.countries2 =
                filter.equipmentFilterForm.countries2;
            currentFilter.current.nominalVoltage1 =
                filter.equipmentFilterForm.nominalVoltage1;
            currentFilter.current.nominalVoltage2 =
                filter.equipmentFilterForm.nominalVoltage2;
        } else {
            currentFilter.current = filter;
        }
        setBtnSaveListDisabled(false);
    };

    const handleCancel = () => {
        onClose();
        currentFilter.current = null;
        setInitialFilter(null);
        setBtnSaveListDisabled(true);
    };

    const handleValidate = () => {
        if (!isFilterCreation) {
            if (contentType === ElementType.FILTER) {
                saveFilter(currentFilter.current)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            } else if (contentType === ElementType.CONTINGENCY_LIST) {
                saveFormContingencyList(currentFilter.current)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            }
            handleCancel();
        } else {
            handleFilterCreation(currentFilter.current);
        }
    };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={onClose}
            aria-labelledby="dialog-title-filters-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <CriteriaFilterDialogContent
                    id={id}
                    open={open}
                    contentType={contentType}
                    handleFilterCreation={handleEditCallback}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleValidate}
                    variant="outlined"
                    disabled={btnSaveListDisabled}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CriteriaBasedFilterDialog;
