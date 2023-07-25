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

export const saveExplicitNamingFilter = (
    tableValues,
    isFilterCreation,
    equipmentType,
    name,
    id,
    setCreateFilterErr,
    activeDirectory,
    handleClose
) => {
    if (isFilterCreation) {
        createFilter(
            {
                type: FilterType.EXPLICIT_NAMING.id,
                equipmentType: equipmentType,
                filterEquipmentsAttributes: tableValues,
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
                filterEquipmentsAttributes: tableValues,
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
