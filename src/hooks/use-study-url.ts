/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { UUID } from 'node:crypto';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ElementType, isStudyMetadata } from '@gridsuite/commons-ui';
import type { AppState } from '../redux/types';

/**
 * Returns a function giving the URL of a study in the study app, or null when this app is unknown.
 */
export function useStudyUrl() {
    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);
    return useCallback(
        (studyUuid: UUID) => {
            const appStudy = appsAndUrls.find(isStudyMetadata);
            const studyResource = appStudy?.resources?.find((resource) => resource.types.includes(ElementType.STUDY));
            return appStudy && studyResource
                ? appStudy.url + studyResource.path.replace('{elementUuid}', studyUuid)
                : null;
        },
        [appsAndUrls]
    );
}
