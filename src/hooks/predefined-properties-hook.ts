/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { mapEquipmentTypeForPredefinedProperties } from '../utils/equipment-types-for-predefined-properties-mapper';
import { fetchAppsAndUrls } from '../utils/rest-api';
import { EquipmentType } from '../utils/equipment-types';

export type PredefinedProperties = {
    [propertyName: string]: string[];
};

interface Metadata {
    name: string;
    url: string;
    appColor: string;
    hiddenInAppsMenu: boolean;
    resources: unknown;
}

interface StudyMetadata extends Metadata {
    name: 'Study';
    predefinedEquipmentProperties: {
        [networkElementType: string]: PredefinedProperties;
    };
}

const isStudyMetadata = (metadata: Metadata): metadata is StudyMetadata => {
    return metadata.name === 'Study';
};

const fetchPredefinedProperties = async (
    equipmentType: EquipmentType
): Promise<PredefinedProperties | undefined> => {
    const networkEquipmentType =
        mapEquipmentTypeForPredefinedProperties(equipmentType);
    if (networkEquipmentType === undefined) {
        return Promise.resolve(undefined);
    }
    const res = await fetchAppsAndUrls();
    const studyMetadata = res.filter(isStudyMetadata);
    if (!studyMetadata) {
        return Promise.reject('Study entry could not be found in metadata');
    }
    return studyMetadata[0].predefinedEquipmentProperties?.[
        networkEquipmentType
    ];
};

export const usePredefinedProperties = (
    initialType: EquipmentType | null
): [PredefinedProperties, Dispatch<SetStateAction<EquipmentType | null>>] => {
    const [type, setType] = useState<EquipmentType | null>(initialType);
    const [equipmentPredefinedProps, setEquipmentPredefinedProps] =
        useState<PredefinedProperties>({});
    const { snackError } = useSnackMessage();

    useEffect(() => {
        if (type !== null) {
            fetchPredefinedProperties(type)
                .then((p) => {
                    if (p !== undefined) {
                        setEquipmentPredefinedProps(p);
                    }
                })
                .catch((error) => {
                    snackError({
                        messageTxt: error.message ?? error,
                    });
                });
        }
    }, [type, setEquipmentPredefinedProps, snackError]);

    return [equipmentPredefinedProps, setType];
};
