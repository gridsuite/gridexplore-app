/*
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ElementAttributes, ElementType } from '@gridsuite/commons-ui';

/**
 * Cleans localStorage entries related to studies by removing keys containing the study UUID.
 * @param selectedElements - Array of selected elements to check for studies.
 */
export function cleanLocalStorageForStudies(selectedElements: ElementAttributes[]): void {
    selectedElements
        .filter((element) => element.type === ElementType.STUDY)
        .forEach((element) => {
            const studyUuid = element.elementUuid;
            Object.keys(localStorage)
                .filter((key) => key.includes(studyUuid))
                .forEach((key) => localStorage.removeItem(key));
        });
}
