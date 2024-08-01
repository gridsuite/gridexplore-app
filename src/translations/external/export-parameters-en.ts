/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const export_parameters_en = {
    'iidm.export.cgmes.base-name': 'Base name',
    'iidm.export.cgmes.base-name.desc': 'Basename for output files',
    'iidm.export.cgmes.cim-version': 'CIM version',
    'iidm.export.cgmes.cim-version.desc': 'CIM version to export',
    'iidm.export.cgmes.cim-version.14': '14',
    'iidm.export.cgmes.cim-version.16': '16',
    'iidm.export.cgmes.cim-version.100': '100',
    'iidm.export.cgmes.export-boundary-power-flows':
        'Export boundary power flows',
    'iidm.export.cgmes.export-boundary-power-flows.desc':
        "Export boundaries' power flows",
    'iidm.export.cgmes.export-power-flows-for-switches':
        'Export power flows for switches',
    'iidm.export.cgmes.export-power-flows-for-switches.desc':
        'Export power flows for switches',
    'iidm.export.cgmes.naming-strategy': 'Naming strategy',
    'iidm.export.cgmes.naming-strategy.desc':
        'Configure what type of naming strategy you want',
    'iidm.export.cgmes.naming-strategy.identity': 'identity',
    'iidm.export.cgmes.naming-strategy.cgmes': 'cgmes',
    'iidm.export.cgmes.naming-strategy.cgmes-fix-all-invalid-ids':
        'cgmes-fix-all-invalid-ids',
    'iidm.export.cgmes.profiles': 'Profiles',
    'iidm.export.cgmes.profiles.desc': 'Profiles to export',
    'iidm.export.cgmes.profiles.EQ': 'EQ',
    'iidm.export.cgmes.profiles.TP': 'TP',
    'iidm.export.cgmes.profiles.SSH': 'SSH',
    'iidm.export.cgmes.profiles.SV': 'SV',
    'iidm.export.cgmes.boundary-EQ-identifier': 'Boundary EQ model identifier',
    'iidm.export.cgmes.boundary-EQ-identifier.desc':
        'Boundary EQ model identifier',
    'iidm.export.cgmes.boundary-TP-identifier': 'Boundary TP model identifier',
    'iidm.export.cgmes.boundary-TP-identifier.desc':
        'Boundary TP model identifier',
    'iidm.export.cgmes.modeling-authority-set': 'Modeling authority set',
    'iidm.export.cgmes.modeling-authority-set.desc': 'Modeling authority set',
    'ucte.export.naming-strategy': 'Naming strategy',
    'ucte.export.naming-strategy.desc':
        'Default naming strategy for UCTE codes conversion',
    'ucte.export.combine-phase-angle-regulation':
        'Combine phase and angle regulation',
    'ucte.export.combine-phase-angle-regulation.desc':
        'Combine phase and angle regulation',
    'iidm.export.xml.indent': 'Indent',
    'iidm.export.xml.indent.desc': 'Indent export output file',
    'iidm.export.xml.with-branch-state-variables': 'With branch state variable',
    'iidm.export.xml.with-branch-state-variables.desc':
        'Export network with branch state variables',
    'iidm.export.xml.only-main-cc': 'Only main CC',
    'iidm.export.xml.only-main-cc.desc': 'Export only main CC',
    'iidm.export.xml.anonymised': 'Anonymise exported network',
    'iidm.export.xml.anonymised.desc': 'Anonymise exported network',
    'iidm.export.xml.iidm-version-incompatibility-behavior':
        'Behavior when there is an IIDM version incompatibility',
    'iidm.export.xml.iidm-version-incompatibility-behavior.desc':
        'Behavior when there is an IIDM version incompatibility',
    'iidm.export.xml.iidm-version-incompatibility-behavior.THROW_EXCEPTION':
        'Throw exception',
    'iidm.export.xml.iidm-version-incompatibility-behavior.LOG_ERROR':
        'Log error',
    'iidm.export.xml.topology-level': 'Topology Level',
    'iidm.export.xml.topology-level.desc':
        'Export network in this topology level',
    'iidm.export.xml.topology-level.BUS_BRANCH': 'BUS_BRANCH',
    'iidm.export.xml.topology-level.BUS_BREAKER': 'BUS_BREAKER',
    'iidm.export.xml.topology-level.NODE_BREAKER': 'NODE_BREAKER',
    'iidm.export.xml.throw-exception-if-extension-not-found':
        'Throw exception if extension not found',
    'iidm.export.xml.throw-exception-if-extension-not-found.desc':
        'Throw exception if extension not found',
    'iidm.export.xml.extensions': 'Extensions',
    'iidm.export.xml.extensions.selectionDialog.name': 'Extensions selection',
    'iidm.export.xml.extensions.desc': 'The list of exported extensions',
    'iidm.export.xml.extensions.activePowerControl': 'Active power control',
    'iidm.export.xml.extensions.baseVoltageMapping': 'Base voltage mapping',
    'iidm.export.xml.extensions.branchObservability': 'Branch observability',
    'iidm.export.xml.extensions.busbarSectionPosition':
        'Busbar section position',
    'iidm.export.xml.extensions.branchStatus':
        'Branch status (IIDM version < 1.12)',
    'iidm.export.xml.extensions.cgmesControlAreas': 'Cgmes control areas',
    'iidm.export.xml.extensions.cgmesDanglingLineBoundaryNode':
        'Cgmes dangling line boundary node',
    'iidm.export.xml.extensions.cgmesLineBoundaryNode':
        'Cgmes line boundary node',
    'iidm.export.xml.extensions.cgmesSshMetadata': 'Cgmes ssh metadata',
    'iidm.export.xml.extensions.cgmesSvMetadata': 'Cgmes sv metadata',
    'iidm.export.xml.extensions.cgmesTapChangers': 'Cgmes tap changers',
    'iidm.export.xml.extensions.cimCharacteristics': 'Cgmes characteristics',
    'iidm.export.xml.extensions.coordinatedReactiveControl':
        'Coordinated reactive control',
    'iidm.export.xml.extensions.detail': 'Load detail',
    'iidm.export.xml.extensions.discreteMeasurements': 'Discrete measurements',
    'iidm.export.xml.extensions.entsoeArea': 'Entsoe area',
    'iidm.export.xml.extensions.entsoeCategory': 'Entsoe category',
    'iidm.export.xml.extensions.generatorActivePowerControl':
        'Generator active power control',
    'iidm.export.xml.extensions.generatorFortescue': 'Generator asymmetrical',
    'iidm.export.xml.extensions.generatorAsymmetrical':
        'Generator asymmetrical',
    'iidm.export.xml.extensions.generatorRemoteReactivePowerControl':
        'Generator remote reactive power control',
    'iidm.export.xml.extensions.generatorShortCircuit':
        'Generator short-circuit',
    'iidm.export.xml.extensions.generatorShortCircuits':
        'Generator short-circuit (IIDM version 1.0)',
    'iidm.export.xml.extensions.hvdcAngleDroopActivePowerControl':
        'HVDC angle droop active power control',
    'iidm.export.xml.extensions.hvdcOperatorActivePowerRange':
        'HVDC operator active power range',
    'iidm.export.xml.extensions.identifiableShortCircuit':
        'Identifiable short-circuit',
    'iidm.export.xml.extensions.injectionObservability':
        'Injection observability',
    'iidm.export.xml.extensions.lineFortescue': 'Line asymmetrical',
    'iidm.export.xml.extensions.lineAsymmetrical': 'Line asymmetrical',
    'iidm.export.xml.extensions.linePosition': 'Line position',
    'iidm.export.xml.extensions.loadFortescue': 'Load asymmetrical',
    'iidm.export.xml.extensions.loadAsymmetrical': 'Load asymmetrical',
    'iidm.export.xml.extensions.measurements': 'Measurements',
    'iidm.export.xml.extensions.mergedXnode': 'Merged Xnode',
    'iidm.export.xml.extensions.operatingStatus': 'Operating status',
    'iidm.export.xml.extensions.position': 'Connectable position',
    'iidm.export.xml.extensions.referencePriorities':
        'Reference priorities (LoadFlow)',
    'iidm.export.xml.extensions.referenceTerminals':
        'Reference terminals (LoadFlow)',
    'iidm.export.xml.extensions.secondaryVoltageControl':
        'Secondary voltage control',
    'iidm.export.xml.extensions.slackTerminal': 'Slack terminal',
    'iidm.export.xml.extensions.standbyAutomaton':
        'Static var compensators automaton',
    'iidm.export.xml.extensions.startup': 'Generator startup',
    'iidm.export.xml.extensions.substationPosition': 'Substation position',
    'iidm.export.xml.extensions.threeWindingsTransformerFortescue':
        'Three windings transformer asymmetrical',
    'iidm.export.xml.extensions.threeWindingsTransformerAsymmetrical':
        'Three windings transformer asymmetrical',
    'iidm.export.xml.extensions.threeWindingsTransformerPhaseAngleClock':
        'Three windings transformer phase angle clock',
    'iidm.export.xml.extensions.threeWindingsTransformerToBeEstimated':
        'Three windings transformer to be estimated',
    'iidm.export.xml.extensions.twoWindingsTransformerFortescue':
        'Two windings transformer asymmetrical',
    'iidm.export.xml.extensions.twoWindingsTransformerAsymmetrical':
        'Two windings transformer asymmetrical',
    'iidm.export.xml.extensions.twoWindingsTransformerPhaseAngleClock':
        'Two windings transformer phase angle clock',
    'iidm.export.xml.extensions.twoWindingsTransformerToBeEstimated':
        'Two windings transformer to be estimated',
    'iidm.export.xml.extensions.voltageLevelShortCircuits':
        'Voltage level short circuits',
    'iidm.export.xml.extensions.voltagePerReactivePowerControl':
        'Voltage per reactive power control',
    'iidm.export.xml.sorted': 'Sort export output file',
    'iidm.export.xml.sorted.desc': 'Sort export output file',
    'iidm.export.xml.version': 'IIDM Version',
    'iidm.export.xml.version.desc':
        'IIDM-XML version in which files will be generated',
    'iidm.export.xml.version.1.0': '1.0',
    'iidm.export.xml.version.1.1': '1.1',
    'iidm.export.xml.version.1.2': '1.2',
    'iidm.export.xml.version.1.3': '1.3',
    'iidm.export.xml.version.1.4': '1.4',
    'iidm.export.xml.version.1.5': '1.5',
    'iidm.export.xml.version.1.6': '1.6',
    'iidm.export.xml.version.1.7': '1.7',
    'iidm.export.xml.version.1.8': '1.8',
    'iidm.export.xml.version.1.9': '1.9',
    'iidm.export.xml.version.1.10': '1.10',
    'iidm.export.xml.version.1.11': '1.11',
    'iidm.export.xml.version.1.12': '1.12',
    'iidm.export.xml.version.1.13': '1.13',
};

export default export_parameters_en;
