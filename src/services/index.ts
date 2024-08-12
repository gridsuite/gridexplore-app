/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getUser } from '../redux/store';
import {
    AppsMetadataComSvc,
    ConfigComSvc,
    ConfigNotificationComSvc,
    FilterComSvc,
    setCommonServices,
    StudyComSvc,
    UserAdminComSvc,
} from '@gridsuite/commons-ui';
import AppLocalSvc from './app-local';
import DirectorySvc from './directory';
import { APP_NAME } from '../utils/config-params';
import CaseSvc from './case';
import DirectoryNotificationSvc from './directory-notification';
import ActionsSvc from './actions';
import NetworkConversionSvc from './network-conversion';
import ExploreSvc from './explore';

export type { EnvJson } from './app-local';
export type { ExportFormats } from './network-conversion';

export const actionsSrv = new ActionsSvc(),
    appLocalSrv = new AppLocalSvc(),
    appsMetadataSrv = new AppsMetadataComSvc(appLocalSrv),
    caseSrv = new CaseSvc(),
    configSrv = new ConfigComSvc(APP_NAME, getUser),
    configNotificationSrv = new ConfigNotificationComSvc(getUser),
    directorySrv = new DirectorySvc(),
    directoryNotificationSrv = new DirectoryNotificationSvc(),
    exploreSrv = new ExploreSvc(),
    filterSrv = new FilterComSvc(getUser),
    networkConversionSrv = new NetworkConversionSvc(),
    studySrv = new StudyComSvc(getUser),
    userAdminSrv = new UserAdminComSvc(getUser);

setCommonServices(
    appLocalSrv,
    appsMetadataSrv,
    configSrv,
    configNotificationSrv,
    directorySrv,
    exploreSrv,
    filterSrv,
    studySrv,
    userAdminSrv
);
