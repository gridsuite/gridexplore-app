/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { createFilter, saveFilter } from '../../../utils/rest-api';
import { FilterType } from '../../../utils/elementType';
import { frontToBackTweak } from './criteria-based-filter-dialog-utils';
import { NAME } from '../../utils/field-constants';
import { Generator, Load } from '../../../utils/equipment-types';

export const saveExplicitNamingFilter = (
    tableValues,
    isFilterCreation,
    equipmentType,
    name,
    id,
    setCreateFilterErr,
    activeDirectory,
    intl,
    handleClose
) => {
    const isGeneratorOrLoad =
        equipmentType === Generator.type || equipmentType === Load.type;
    let hasMissingIdWithDistrKey = tableValues.some(
        (el) => !el?.equipmentID?.trim() && el.distributionKey
    );
    if (hasMissingIdWithDistrKey) {
        setCreateFilterErr(
            intl.formatMessage({
                id: 'distributionKeyWithMissingIdError',
            })
        );
        return;
    }

    let values = tableValues.filter(
        (el) => el?.equipmentID && el.equipmentID.trim().length > 0
    );
    if (values.length === 0) {
        setCreateFilterErr(
            intl.formatMessage({
                id: 'emptyFilterError',
            })
        );
        return;
    }

    let isAllKeysNull = values.every((row) => !row.distributionKey);
    values.forEach((val, index) => {
        // we check if all the distribution keys are null.
        // If one is set, all the distribution keys that are null take 0 as value
        const isDKEmpty =
            isGeneratorOrLoad && !isAllKeysNull && !val.distributionKey;
        values[index] = {
            equipmentID: val.equipmentID?.trim(),
            distributionKey: isDKEmpty ? 0 : val?.distributionKey,
        };
    });
    if (isFilterCreation) {
        createFilter(
            {
                type: FilterType.EXPLICIT_NAMING.id,
                equipmentType: equipmentType,
                filterEquipmentsAttributes: values,
            },
            name,
            activeDirectory
        )
            .then(() => {
                handleClose();
            })
            .catch((error) => {
                setCreateFilterErr(error.message);
            });
    } else {
        saveFilter(
            {
                id: id,
                type: FilterType.EXPLICIT_NAMING.id,
                equipmentType: equipmentType,
                filterEquipmentsAttributes: values,
            },
            name
        )
            .then(() => {
                handleClose();
            })
            .catch((error) => {
                setCreateFilterErr(error.message);
            });
    }
};

export const saveCriteriaBasedFilter = (
    filter,
    activeDirectory,
    onClose,
    onError
) => {
    const filterForBack = frontToBackTweak(undefined, filter); // no need ID for creation
    createFilter(filterForBack, filter[NAME], activeDirectory)
        .then(() => {
            onClose();
        })
        .catch((error) => {
            onError(error.message);
        });
};
