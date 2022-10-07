/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { MenuItem, Grid, Select, FormControl, InputLabel } from '@mui/material';
import { filteredTypes } from './filters';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { getFilterById, saveFilter } from '../../utils/rest-api';
import { displayErrorMessageWithSnackbar } from '../../utils/messages';
import { FilterType } from '../../utils/elementType';

const useStyles = makeStyles(() => ({
    controlItem: {
        justifyContent: 'flex-end',
    },
    idText: {
        padding: 8,
    },
    dialogPaper: {
        minWidth: '705px',
        minHeight: '500px',
        margin: 'auto',
    },
    filtersEditor: {
        minWidth: '570px',
        margin: 'auto',
    },
}));

const equipmentsDefinition = {
    LINE: {
        label: 'Lines',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
                occurs: 2,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
                occurs: 1,
                displayName: 'nominalVoltage',
            },
        },
    },
    TWO_WINDINGS_TRANSFORMER: {
        label: 'TwoWindingsTransformers',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
                occurs: 2,
            },
        },
    },
    THREE_WINDINGS_TRANSFORMER: {
        label: 'ThreeWindingsTransformers',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
                occurs: 3,
            },
        },
    },
    GENERATOR: {
        label: 'Generators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    LOAD: {
        label: 'Loads',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    BATTERY: {
        label: 'Batteries',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    SHUNT_COMPENSATOR: {
        label: 'ShuntCompensators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    STATIC_VAR_COMPENSATOR: {
        label: 'StaticVarCompensators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    DANGLING_LINE: {
        label: 'DanglingLines',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    LCC_CONVERTER_STATION: {
        label: 'LccConverterStations',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    VSC_CONVERTER_STATION: {
        label: 'VscConverterStations',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    HVDC_LINE: {
        label: 'HvdcLines',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
                occurs: 2,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
};

function deepCopy(aObject) {
    if (!aObject) {
        return aObject;
    }
    let v;
    let bObject = Array.isArray(aObject) ? [] : {};
    for (const k in aObject) {
        v = aObject[k];
        bObject[k] = typeof v === 'object' ? deepCopy(v) : v;
    }
    return bObject;
}

function generateDefaultValue(val, originalValue) {
    if (originalValue != null) return { value: originalValue };
    return {
        value: deepCopy(val.defaultValue) || deepCopy(val.type.defaultValue),
    };
}

const SingleFilter = ({ filter, definition, onChange, sequence }) => {
    const localChange = (newVal) => {
        filter.value = newVal;
        onChange();
    };

    return definition.type.renderer({
        initialValue: filter.value,
        onChange: localChange,
        titleMessage: definition.displayName
            ? definition.displayName
            : sequence
            ? definition.name + sequence
            : definition.name,
    });
};

export const FilterTypeSelection = ({ type, onChange }) => {
    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel>
                    <FormattedMessage id={'equipmentType'} />
                </InputLabel>

                <Select
                    label={<FormattedMessage id={'equipmentType'} />}
                    value={type === null ? '' : type}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {Object.entries(equipmentsDefinition).map(
                        ([key, value]) => (
                            <MenuItem key={key} value={key}>
                                <FormattedMessage id={value.label} />
                            </MenuItem>
                        )
                    )}
                </Select>
            </FormControl>
        </>
    );
};

export const GenericFilterDialog = ({ id, open, onClose, title }) => {
    const [initialFilter, setInitialFilter] = useState(null);
    const [filterType, setFilterType] = useState(null);
    const [currentFormEdit, setCurrentFormEdit] = useState({
        type: { value: filterType },
    });
    const currentFilter = useRef(null);
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const classes = useStyles();

    useEffect(() => {
        if (id !== null) {
            getFilterById(id).then((response) => {
                setInitialFilter(response);
                setFilterType(response.equipmentFilterForm.equipmentType);
                setCurrentFormEdit({
                    equipmentType: {
                        value: response.equipmentFilterForm.equipmentType,
                    },
                });
            });
        } else {
            setCurrentFormEdit({
                equipmentType: { value: null },
            });
            currentFilter.current = null;
            setInitialFilter(null);
            setFilterType(null);
        }
    }, [id]);

    useEffect(() => {
        if (initialFilter !== null) {
            setBtnSaveListDisabled(initialFilter.transient !== true);
        }
    }, [initialFilter]);

    function onChange(newVal) {
        currentFilter.current = {};
        currentFilter.current.id = id;
        currentFilter.current.type = FilterType.FORM;
        currentFilter.current.equipmentFilterForm = newVal;
        setBtnSaveListDisabled(false);
    }

    const handleCancel = () => {
        onClose();
        currentFilter.current = null;
        setCurrentFormEdit({
            equipmentType: { value: null },
        });
        setInitialFilter(null);
        setFilterType(null);
        setBtnSaveListDisabled(true);
    };

    const handleClick = () => {
        saveFilter(currentFilter.current)
            .then()
            .catch((error) => {
                displayErrorMessageWithSnackbar(error.message);
            });
        onClose();
    };

    function validVoltageValues(obj) {
        let value1 =
            obj.value.hasOwnProperty('value1') && obj.value['value1'] !== null;
        if (obj.value.type === 'RANGE') {
            return (
                value1 &&
                obj.value.hasOwnProperty('value2') &&
                obj.value['value2'] !== null
            );
        }
        return value1;
    }

    const editDone = () => {
        let res = {};
        Object.entries(currentFormEdit).forEach(([key, obj]) => {
            if (
                key.startsWith('nominalVoltage') && // dont send nominalVoltage with null values
                !validVoltageValues(obj)
            ) {
                res[key] = null;
            } else {
                res[key] = obj.value;
            }
        });
        onChange(res);
    };

    const changeFilterType = (newType) => {
        // TODO: should reset all fields in currentFormEdit
        currentFormEdit.equipmentType = { value: newType };
        setFilterType(newType);
        editDone();
    };

    const renderFilter = (key, definition, sequence) => {
        if (initialFilter !== null) {
            if (currentFormEdit[key] === undefined) {
                currentFormEdit[key] = generateDefaultValue(
                    definition,
                    initialFilter.equipmentFilterForm[key]
                );
            }
            return (
                <SingleFilter
                    key={key}
                    filter={currentFormEdit[key]}
                    definition={definition}
                    onChange={editDone}
                    sequence={sequence}
                />
            );
        }
    };

    const renderSpecific = () => {
        if (filterType !== null) {
            return Object.entries(equipmentsDefinition[filterType].fields).map(
                ([key, definition]) => {
                    if (definition.occurs) {
                        return [
                            ...Array.from(Array(definition.occurs).keys()),
                        ].map((n) => {
                            return renderFilter(
                                key + (n + 1).toString(),
                                definition,
                                n + 1
                            );
                        });
                    } else {
                        return renderFilter(key, definition);
                    }
                }
            );
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
                <Grid
                    container
                    spacing={1}
                    style={{ width: '100%', padding: 10, paddingRight: 20 }}
                >
                    {FilterTypeSelection({
                        type: filterType,
                        onChange: changeFilterType,
                    })}
                    {renderSpecific()}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleClick}
                    variant="outlined"
                    disabled={btnSaveListDisabled}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GenericFilterDialog;
