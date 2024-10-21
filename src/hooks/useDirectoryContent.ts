/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { ElementAttributes, fetchElementsInfos, useSnackMessage } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { fetchUsersIdentities, UsersIdentitiesMap } from '../utils/rest-api';
import { AppState } from '../redux/reducer';

const getName = (userId: string, data: UsersIdentitiesMap): string => {
    const firstName = data?.[userId]?.firstName;
    const lastName = data?.[userId]?.lastName;
    if (firstName && lastName) {
        return firstName + ' ' + lastName;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    } else {
        return userId; // fallback to id
    }
};

export const useDirectoryContent = () => {
    const currentChildren = useSelector((state: AppState) => state.currentChildren);
    const [childrenMetadata, setChildrenMetadata] = useState<Record<UUID, ElementAttributes>>({});
    const { snackError } = useSnackMessage();
    const previousData = useRef<ElementAttributes[]>();
    previousData.current = currentChildren;

    const handleError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    useEffect(() => {
        if (!currentChildren?.length) {
            setChildrenMetadata({});
            return;
        }

        // Do not fetch metadata again if we just added a ghost element
        if (Object.values(currentChildren).some((e) => e.uploading)) {
            return;
        }

        let metadata: Record<UUID, ElementAttributes> = {};
        let childrenToFetchElementsInfos = Object.values(currentChildren).map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            Promise.all([
                fetchUsersIdentities(childrenToFetchElementsInfos), // TODO cache user identities across elements
                fetchElementsInfos(childrenToFetchElementsInfos),
            ])
                .then((res) => {
                    // discarding request for older directory
                    if (previousData.current === currentChildren) {
                        res[1].forEach((e) => {
                            e.owner = getName(e.owner, res[0]?.data);
                            e.lastModifiedBy = getName(e.lastModifiedBy, res[0].data);
                            metadata[e.elementUuid] = e;
                        });
                        setChildrenMetadata(metadata);
                    }
                })
                .catch((error) => {
                    if (previousData.current && Object.keys(previousData.current).length === 0) {
                        handleError(error.message);
                    }
                });
        }
    }, [handleError, currentChildren]);

    // TODO remove this when global user identity caching is implemented
    const currentChildrenWithOwnerNames = useMemo(() => {
        if (!currentChildren) {
            return currentChildren;
        } else {
            return currentChildren.map((x) => ({
                ...x,
                owner: childrenMetadata?.[x.elementUuid]?.owner,
                lastModifiedBy: childrenMetadata?.[x.elementUuid]?.lastModifiedBy,
            }));
        }
    }, [currentChildren, childrenMetadata]);

    return [currentChildrenWithOwnerNames, childrenMetadata] as const;
};
