/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';

import ExplicitNamingFilterDialogContent from './explicit-naming-filter-dialog-content';
import filterSave from './filters-save';

import makeStyles from '@mui/styles/makeStyles';
import { ElementType } from '../../utils/elementType';
import NameWrapper from './name-wrapper';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

const ExplicitNamingFilterCreationDialog = ({
    id,
    open,
    onClose,
    name,
    title,
    isFilterCreation,
}) => {
    const classes = useStyles();
    const intl = useIntl();

    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);

    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const [tableValues, setTablesValues] = useState([]);
    const [isEdited, setIsEdited] = useState(false);
    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isFilterCreation;

    const [currentName, setCurrentName] = useState(name);
    const [isNameValide, setIsNameValide] = useState(true);

    useEffect(() => {
        setIsGeneratorOrLoad(
            equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
        );
    }, [equipmentType]);

    const handleEditCallback = (
        tableValues,
        isGeneratorOrLoad,
        isFilterCreation,
        equipmentType,
        name,
        id,
        isEdited,
        isDragged
    ) => {
        setEquipmentType(equipmentType);
        setTablesValues(tableValues);
        setIsEdited(isEdited);
        if (isDragged) {
            setIsEdited(true);
        }
    };

    useEffect(() => {
        setCreateFilterErr('');
    }, [tableValues]);

    const handleCreateFilter = () => {
        filterSave(
            tableValues,
            isGeneratorOrLoad,
            isFilterCreation,
            equipmentType,
            name,
            id,
            setCreateFilterErr,
            activeDirectory,
            intl,
            handleClose,
            currentName
        );
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const isFormValidationAllowed = () => {
        const areTableValuesValide =
            isEdited &&
            tableValues?.length > 0 &&
            createFilterErr === '' &&
            equipmentType;
        return isNameValide && (areTableValuesValide || name !== currentName);
    };

    const nameCheck = (isValide, newName) => {
        setIsNameValide(isValide);
        setCurrentName(newName);
    };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            fullWidth={true}
            open={open}
            onClose={handleClose}
            scroll="body"
        >
            <DialogTitle onClose={onClose}>{title}</DialogTitle>
            <DialogContent style={{ overflow: 'hidden' }}>
                <NameWrapper
                    titleMessage="Name"
                    isCreation={isFilterCreation}
                    initialValue={name}
                    contentType={ElementType.FILTER}
                    handleNameValidation={nameCheck}
                >
                    <ExplicitNamingFilterDialogContent
                        id={id}
                        open={open}
                        name={name}
                        isFilterCreation={isFilterCreation}
                        handleFilterCreation={handleEditCallback}
                    />
                </NameWrapper>
                {createFilterErr !== '' && (
                    <Alert severity="error">{createFilterErr}</Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleCreateFilter}
                    disabled={!isFormValidationAllowed()}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ExplicitNamingFilterCreationDialog.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isFilterCreation: PropTypes.bool,
};

export default ExplicitNamingFilterCreationDialog;
