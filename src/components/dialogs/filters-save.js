/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { createFilter, saveFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';

const filterSave = (
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
    updatedName
) => {
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
                type: FilterType.EXPLICIT_NAMING,
                equipmentType: equipmentType,
                filterEquipmentsAttributes: values,
            },
            name,
            activeDirectory
        )
            .then(() => {
                handleClose();
            })
            .catch((message) => {
                setCreateFilterErr(message);
            });
    } else {
        saveFilter(
            {
                id: id,
                type: FilterType.EXPLICIT_NAMING,
                equipmentType: equipmentType,
                filterEquipmentsAttributes: values,
            },
            updatedName
        )
            .then(() => {
                handleClose();
            })
            .catch((message) => {
                setCreateFilterErr(message);
            });
    }
};

export default filterSave;
