/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FilterType } from '../../../../utils/elementType';
import {
    CRITERIA_BASED,
    ENERGY_SOURCE,
    EQUIPMENT_TYPE,
    NOMINAL_VOLTAGE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
    NOMINAL_VOLTAGE_3,
    VALUE_1,
    VALUE_2,
} from '../../../utils/field-constants';
import {
    FREE_FILTER_PROPERTIES,
    SUBSTATION_FILTER_PROPERTIES,
} from './filter-properties';
import {
    PROPERTY_NAME,
    PROPERTY_VALUES,
    PROPERTY_VALUES_1,
    PROPERTY_VALUES_2,
} from './filter-property';
import { getCriteriaBasedFormData } from '../../commons/criteria-based/criteria-based-utils';

/**
 * Transform
 * from obj.equipmentFilterForm.{
 *  freeProperties.{nameB:valuesB},
 *  freeProperties1.{nameA:valuesA},
 *  freeProperties2.{nameA:valuesC}}
 * to a obj.criteriaBased.freeProperties.[
 *  {name_property:nameA, prop_values1:valuesA, prop_values2:valuesC},
 *  {name_property:namesB, prop_values:valuesB}]
 * @author Laurent LAUGARN modified by Florent MILLOT
 */
export const backToFrontTweak = (response) => {
    console.log(response);

    const subProps = response.equipmentFilterForm.substationFreeProperties;
    const freeProps = response.equipmentFilterForm.freeProperties;
    const props1 = response.equipmentFilterForm.freeProperties1;
    const props2 = response.equipmentFilterForm.freeProperties2;
    const allKeys = new Set();
    if (subProps) {
        Object.keys(subProps).forEach((k) => allKeys.add(k));
    }
    if (props1) {
        Object.keys(props1).forEach((k) => allKeys.add(k));
    }
    if (props2) {
        Object.keys(props2).forEach((k) => allKeys.add(k));
    }
    const filterSubstationProperties = [];
    const filterFreeProperties = [];
    allKeys.forEach((k) => {
        const prop = { [PROPERTY_NAME]: k };
        const values = subProps?.[k];
        if (values) {
            prop[PROPERTY_VALUES] = values;
        }
        const values1 = props1?.[k];
        if (values1) {
            prop[PROPERTY_VALUES_1] = values1;
        }
        const values2 = props2?.[k];
        if (values2) {
            prop[PROPERTY_VALUES_2] = values2;
        }
        filterSubstationProperties.push(prop);
    });
    allKeys.clear();
    if (freeProps) {
        Object.keys(freeProps).forEach((k) => allKeys.add(k));
    }
    allKeys.forEach((k) => {
        const prop = { [PROPERTY_NAME]: k };
        const values = freeProps?.[k];
        if (values) {
            prop[PROPERTY_VALUES] = values;
        }
        filterFreeProperties.push(prop);
    });

    const ret = {
        [EQUIPMENT_TYPE]: response[EQUIPMENT_TYPE],
        ...getCriteriaBasedFormData(response.equipmentFilterForm, {
            [ENERGY_SOURCE]: response.equipmentFilterForm[ENERGY_SOURCE],
            [SUBSTATION_FILTER_PROPERTIES]: filterSubstationProperties,
            [FREE_FILTER_PROPERTIES]: filterFreeProperties,
        }),
    };
    return ret;
};

/**
 * Transform
 * from obj.criteriaBased.freeProperties.[
 *  {name_property:nameA, prop_values1:valuesA, prop_values2:valuesC},
 *  {name_property:namesB, prop_values:valuesB}]
 * to obj.equipmentFilterForm.{
 *  freeProperties.{nameB:valuesB},
 *  freeProperties1.{nameA:valuesA},
 *  freeProperties2.{nameA:valuesC}}
 * @author Laurent LAUGARN modified by Florent MILLOT
 */
export const frontToBackTweak = (id, filter) => {
    const filterSubstationProperties =
        filter[CRITERIA_BASED][SUBSTATION_FILTER_PROPERTIES];
    const ret = { id, type: FilterType.CRITERIA_BASED.id };
    const eff = {
        [EQUIPMENT_TYPE]: filter[EQUIPMENT_TYPE],
        ...cleanNominalVoltages(filter[CRITERIA_BASED]),
    };
    // in the back end we store everything in a field called equipmentFilterForm
    ret.equipmentFilterForm = eff;
    delete eff[SUBSTATION_FILTER_PROPERTIES];
    const props = {};
    const props1 = {};
    const props2 = {};
    filterSubstationProperties.forEach((prop) => {
        const values = prop[PROPERTY_VALUES];
        const values1 = prop[PROPERTY_VALUES_1];
        const values2 = prop[PROPERTY_VALUES_2];
        if (values) {
            props[prop[PROPERTY_NAME]] = values;
        }
        if (values1) {
            props1[prop[PROPERTY_NAME]] = values1;
        }
        if (values2) {
            props2[prop[PROPERTY_NAME]] = values2;
        }
    });
    eff.substationFreeProperties = props;
    eff.freeProperties1 = props1;
    eff.freeProperties2 = props2;

    const filterFreeProperties = filter[CRITERIA_BASED][FREE_FILTER_PROPERTIES];
    // in the back end we store everything in a field called equipmentFilterForm
    delete eff[FREE_FILTER_PROPERTIES];
    const freeProps = {};
    filterFreeProperties.forEach((prop) => {
        const values = prop[PROPERTY_VALUES];
        if (values) {
            freeProps[prop[PROPERTY_NAME]] = values;
        }
    });
    eff.freeProperties = freeProps;
    return ret;
};

// The server expect them to be null if the user don't fill them, unlike contingency list
function cleanNominalVoltages(formValues) {
    if (isNominalVoltageEmpty(formValues[NOMINAL_VOLTAGE])) {
        formValues[NOMINAL_VOLTAGE] = null;
    }
    if (isNominalVoltageEmpty(formValues[NOMINAL_VOLTAGE_1])) {
        formValues[NOMINAL_VOLTAGE_1] = null;
    }
    if (isNominalVoltageEmpty(formValues[NOMINAL_VOLTAGE_2])) {
        formValues[NOMINAL_VOLTAGE_2] = null;
    }
    if (isNominalVoltageEmpty(formValues[NOMINAL_VOLTAGE_3])) {
        formValues[NOMINAL_VOLTAGE_3] = null;
    }
    return formValues;
}

function isNominalVoltageEmpty(nominalVoltage) {
    return nominalVoltage[VALUE_1] === null && nominalVoltage[VALUE_2] === null;
}
