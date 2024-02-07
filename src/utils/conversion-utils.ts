/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const GRIDSUITE_DEFAULT_PRECISION: number = 13;

export const roundToPrecision = (num: number, precision: number) =>
    Number(num.toPrecision(precision));

export const roundToDefaultPrecision = (num: number) =>
    roundToPrecision(num, GRIDSUITE_DEFAULT_PRECISION);

export function isBlankOrEmpty(value: unknown) {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === 'string') {
        return /^\s*$/.test(value);
    }
    return false;
}

export const unitToMicroUnit = (num: number) =>
    isBlankOrEmpty(num) ? undefined : roundToDefaultPrecision(num * 1e6);

export const microUnitToUnit = (num: number) =>
    isBlankOrEmpty(num) ? undefined : roundToDefaultPrecision(num / 1e6);
