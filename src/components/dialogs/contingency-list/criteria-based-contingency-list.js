import { useFormContext, useWatch } from 'react-hook-form';
import {
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_TYPE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../utils/field-constants';
import { DEFAULT_RANGE_VALUE } from '../../utils/rhf-inputs/range-input';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../commons/criteria-based/criteria-based-utils';
import CriteriaBasedForm from '../commons/criteria-based/criteria-based-form';
import React from 'react';

const CriteriaBasedContingencyList = () => {
    const { getValues, setValue } = useFormContext();
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const openConfirmationPopup = () => {
        const defaultRangeValue = JSON.stringify(DEFAULT_RANGE_VALUE);
        return (
            watchEquipmentType &&
            (getValues(COUNTRIES_1).length > 0 ||
                getValues(COUNTRIES_2).length > 0 ||
                JSON.stringify(getValues(NOMINAL_VOLTAGE_1)) !==
                    defaultRangeValue ||
                JSON.stringify(getValues(NOMINAL_VOLTAGE_2)) !==
                    defaultRangeValue)
        );
    };

    const handleResetOnConfirmation = () => {
        setValue(COUNTRIES_1, []);
        setValue(COUNTRIES_2, []);
        setValue(NOMINAL_VOLTAGE_1, DEFAULT_RANGE_VALUE);
        setValue(NOMINAL_VOLTAGE_2, DEFAULT_RANGE_VALUE);
    };

    return (
        <CriteriaBasedForm
            equipments={CONTINGENCY_LIST_EQUIPMENTS}
            openConfirmationPopup={openConfirmationPopup}
            handleResetOnConfirmation={handleResetOnConfirmation}
        />
    );
};

export default CriteriaBasedContingencyList;
