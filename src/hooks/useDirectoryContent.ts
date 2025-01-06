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
import { UsersIdentities, UsersIdentitiesMap } from 'utils/user-identities.type';
import { fetchUsersIdentities } from '../utils/rest-api';
import { AppState } from '../redux/types';

const getName = (userId: string, data: UsersIdentitiesMap): string => {
    const firstName = data?.[userId]?.firstName;
    const lastName = data?.[userId]?.lastName;
    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    }
    if (firstName) {
        return firstName;
    }
    if (lastName) {
        return lastName;
    }
    // fallback to id
    return userId;
};

export const useDirectoryContent = () => {
    const currentChildren = useSelector((state: AppState) => state.currentChildren);
    const knownUsersIdentitiesRef = useRef<UsersIdentitiesMap>({});
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

        const metadata: Record<UUID, ElementAttributes> = {};
        const childrenToFetchElementsInfos = Object.values(currentChildren).map((e) => e.elementUuid);
        const childrenToFetchUsersIdentitiesInfos = Object.values(currentChildren)
            .filter(
                (e) =>
                    knownUsersIdentitiesRef.current?.[e.owner] === undefined ||
                    knownUsersIdentitiesRef.current?.[e.lastModifiedBy] === undefined
            )
            .map((e) => e.elementUuid);
        const fetchUsersIdentitiesPromise = fetchUsersIdentities(childrenToFetchUsersIdentitiesInfos).catch(() => {
            // Last resort, server down, error 500, fallback to subs as users Identities
            // We write this code to have the same behavior as when there are partial results,
            // (missing users identities), see getName()
            const fallbackUsersIdentities: UsersIdentities = {
                data: Object.fromEntries(
                    [...new Set(currentChildren.flatMap((e) => [e.owner, e.lastModifiedBy]))].map((sub) => [
                        sub,
                        { sub, firstName: '', lastName: '' },
                    ])
                ),
                errors: {},
            };

            return fallbackUsersIdentities;
        });

        if (childrenToFetchElementsInfos.length > 0) {
            Promise.all([fetchUsersIdentitiesPromise, fetchElementsInfos(childrenToFetchElementsInfos)])
                .then((res) => {
                    if (res[0] && res[0].data) {
                        Object.entries(res[0].data).forEach(([k, v]) => {
                            knownUsersIdentitiesRef.current[k] = v;
                        });
                    }

                    // discarding request for older directory
                    if (previousData.current === currentChildren) {
                        res[1].forEach((e) => {
                            e.ownerLabel = getName(e.owner, knownUsersIdentitiesRef.current);
                            e.lastModifiedByLabel = getName(e.lastModifiedBy, knownUsersIdentitiesRef.current);
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

    // TODO remove this when currentChildren and metadata are fetched at once
    const currentChildrenWithOwnerNames = useMemo(() => {
        if (!currentChildren) {
            return currentChildren;
        }
        return currentChildren.map((x) => ({
            ...x,
            ownerLabel: childrenMetadata?.[x.elementUuid]?.ownerLabel,
            lastModifiedByLabel: childrenMetadata?.[x.elementUuid]?.lastModifiedByLabel,
        }));
    }, [currentChildren, childrenMetadata]);

    return [currentChildrenWithOwnerNames, childrenMetadata] as const;
};
