
/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';

export const AlertMessage = () => {

    const handleClick = (e) => {
        alert("My Awesome Alert message");
    };
    return (
        <div>
            <button onClick={() => handleClick()}>Private Library Button</button>
        </div>
    )
};

export default AlertMessage;
