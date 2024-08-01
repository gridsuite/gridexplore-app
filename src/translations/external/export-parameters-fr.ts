/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const export_parameters_fr = {
    'iidm.export.cgmes.base-name': 'Nom des fichiers',
    'iidm.export.cgmes.base-name.desc': "Nom des fichiers d'export",
    'iidm.export.cgmes.cim-version': 'Version CIM',
    'iidm.export.cgmes.cim-version.desc': 'Version du CIM à exporter',
    'iidm.export.cgmes.cim-version.14': '14',
    'iidm.export.cgmes.cim-version.16': '16',
    'iidm.export.cgmes.cim-version.100': '100',
    'iidm.export.cgmes.export-boundary-power-flows':
        'Exporter les flux des terminaux frontières',
    'iidm.export.cgmes.export-boundary-power-flows.desc':
        'Exporter les flux des terminaux frontières dans le fichier SV',
    'iidm.export.cgmes.export-power-flows-for-switches':
        'Exporter les flux au niveau des OCs',
    'iidm.export.cgmes.export-power-flows-for-switches.desc':
        'Exporter les flux au niveau des organes de coupures dans le fichier SV',
    'iidm.export.cgmes.naming-strategy':
        'Type de conversion utilisé pour créer les identifiants CGMES',
    'iidm.export.cgmes.naming-strategy.desc':
        'Type de conversion utilisé pour créer les identifiants CGMES',
    'iidm.export.cgmes.naming-strategy.identity': 'identity',
    'iidm.export.cgmes.naming-strategy.cgmes': 'cgmes',
    'iidm.export.cgmes.naming-strategy.cgmes-fix-all-invalid-ids':
        'cgmes-fix-all-invalid-ids',
    'iidm.export.cgmes.profiles': 'Profils',
    'iidm.export.cgmes.profiles.desc': 'Profils à exporter',
    'iidm.export.cgmes.profiles.EQ': 'EQ',
    'iidm.export.cgmes.profiles.TP': 'TP',
    'iidm.export.cgmes.profiles.SSH': 'SSH',
    'iidm.export.cgmes.profiles.SV': 'SV',
    'iidm.export.cgmes.boundary-EQ-identifier':
        'Identifiant du fichier de boundary EQ',
    'iidm.export.cgmes.boundary-EQ-identifier.desc':
        'Identifiant du fichier EQ décrivant les terminaux frontières',
    'iidm.export.cgmes.boundary-TP-identifier':
        'Identifiant du fichier de boundary TP',
    'iidm.export.cgmes.boundary-TP-identifier.desc':
        'Identifiant du fichier TP décrivant la topologie des terminaux frontières',
    'iidm.export.cgmes.modeling-authority-set':
        'Définition du ModelingAuthority',
    'iidm.export.cgmes.modeling-authority-set.desc':
        'Définition du ModelingAuthority',
    'ucte.export.naming-strategy':
        'Type de conversion utilisé pour créer les identifiants UCTE',
    'ucte.export.naming-strategy.desc':
        'Type de conversion utilisé pour créer les identifiants UCTE',
    'ucte.export.combine-phase-angle-regulation':
        'Combiner les lois de réglage et de déphasage',
    'ucte.export.combine-phase-angle-regulation.desc':
        'Combiner les lois de réglage et de déphasage',
    'iidm.export.xml.indent': 'Indentation du fichier exporté',
    'iidm.export.xml.indent.desc': 'Indentation du fichier exporté',
    'iidm.export.xml.with-branch-state-variables':
        'Exporter les flux au niveau des quadripôles',
    'iidm.export.xml.with-branch-state-variables.desc':
        'Exporter les flux au niveau des quadripôles',
    'iidm.export.xml.only-main-cc': 'Exporter seulement la CC principale',
    'iidm.export.xml.only-main-cc.desc':
        'Exporter seulement la composante connexe principale',
    'iidm.export.xml.anonymised': 'Anonymisation du réseau exporté',
    'iidm.export.xml.anonymised.desc': 'Anonymisation du réseau exporté',
    'iidm.export.xml.iidm-version-incompatibility-behavior':
        "Comportement en cas d'incompatibilité de version IIDM",
    'iidm.export.xml.iidm-version-incompatibility-behavior.desc':
        "Comportement en cas d'incompatibilité de version IIDM",
    'iidm.export.xml.iidm-version-incompatibility-behavior.THROW_EXCEPTION':
        'Exception',
    'iidm.export.xml.iidm-version-incompatibility-behavior.LOG_ERROR': 'Logs',
    'iidm.export.xml.topology-level': 'Niveau de détail de la topologie',
    'iidm.export.xml.topology-level.desc': 'Niveau de détail de la topologie',
    'iidm.export.xml.topology-level.BUS_BRANCH': 'BUS_BRANCH',
    'iidm.export.xml.topology-level.BUS_BREAKER': 'BUS_BREAKER',
    'iidm.export.xml.topology-level.NODE_BREAKER': 'NODE_BREAKER',
    'iidm.export.xml.throw-exception-if-extension-not-found':
        "Exception si une extension n'est pas connue",
    'iidm.export.xml.throw-exception-if-extension-not-found.desc':
        "Lever une exception si on essaie d'exporter une extension inconnue",
    'iidm.export.xml.extensions': 'Extensions',
    'iidm.export.xml.extensions.selectionDialog.name':
        'Sélection des extensions',
    'iidm.export.xml.extensions.desc': 'Exporter avec ces extensions',
    'iidm.export.xml.extensions.activePowerControl': 'Compensation',
    'iidm.export.xml.extensions.baseVoltageMapping': 'Tension nominale',
    'iidm.export.xml.extensions.branchObservability':
        'Observabilité des quadripôles',
    'iidm.export.xml.extensions.busbarSectionPosition': 'Position des SJBs',
    'iidm.export.xml.extensions.branchStatus':
        'Statut de consignation et de déclenchement (Version IIDM < 1.12)',
    'iidm.export.xml.extensions.cgmesControlAreas': 'Cgmes - zone géographique',
    'iidm.export.xml.extensions.cgmesDanglingLineBoundaryNode':
        'Code EIC des lignes frontières (ligne non mergée)',
    'iidm.export.xml.extensions.cgmesLineBoundaryNode':
        'Code EIC des lignes frontières (ligne complète)',
    'iidm.export.xml.extensions.cgmesSshMetadata': 'Cgmes - ssh métadonnées',
    'iidm.export.xml.extensions.cgmesSvMetadata': 'Cgmes - sv métadonnées',
    'iidm.export.xml.extensions.cgmesTapChangers':
        'Cgmes - lois de réglage et déphasage',
    'iidm.export.xml.extensions.cimCharacteristics': 'Cgmes - caractéristiques',
    'iidm.export.xml.extensions.coordinatedReactiveControl':
        'Contrôle coordonné du réactif',
    'iidm.export.xml.extensions.detail':
        'Données détaillées des consommations (fixe | affine)',
    'iidm.export.xml.extensions.discreteMeasurements':
        'Télémesures (Régleurs et Déphaseurs)',
    'iidm.export.xml.extensions.entsoeArea': 'Zone Entsoe',
    'iidm.export.xml.extensions.entsoeCategory': 'Catégorie Entsoe des groupes',
    'iidm.export.xml.extensions.generatorActivePowerControl':
        'Compensation (Groupes)',
    'iidm.export.xml.extensions.generatorFortescue':
        'Données pour les calculs dissymétriques des groupes',
    'iidm.export.xml.extensions.generatorAsymmetrical':
        'Données pour les calculs dissymétriques des groupes',
    'iidm.export.xml.extensions.generatorRemoteReactivePowerControl':
        'Régulation à distance de la puissance réactive des groupes',
    'iidm.export.xml.extensions.generatorShortCircuit':
        'Données de court-circuit des groupes',
    'iidm.export.xml.extensions.generatorShortCircuits':
        'Données de court-circuit des groupes (Version IIDM 1.0)',
    'iidm.export.xml.extensions.hvdcAngleDroopActivePowerControl':
        'Emulation AC pour les HVDCs',
    'iidm.export.xml.extensions.hvdcOperatorActivePowerRange':
        'Limites de transits des HVDCs',
    'iidm.export.xml.extensions.identifiableShortCircuit':
        'Données de court-circuit des postes',
    'iidm.export.xml.extensions.injectionObservability':
        'Observabilité des injections',
    'iidm.export.xml.extensions.lineFortescue':
        'Données pour les calculs dissymétriques des lignes',
    'iidm.export.xml.extensions.lineAsymmetrical':
        'Données pour les calculs dissymétriques des lignes',
    'iidm.export.xml.extensions.linePosition':
        'Coordonnées géographiques de lignes',
    'iidm.export.xml.extensions.loadFortescue':
        'Données pour les calculs dissymétriques des consommations',
    'iidm.export.xml.extensions.loadAsymmetrical':
        'Données pour les calculs dissymétriques des consommations',
    'iidm.export.xml.extensions.measurements': 'Télémesures',
    'iidm.export.xml.extensions.mergedXnode': 'Xnode mergé',
    'iidm.export.xml.extensions.operatingStatus':
        'Statut de consignation et de déclenchement',
    'iidm.export.xml.extensions.position': 'Position des départs',
    'iidm.export.xml.extensions.referencePriorities':
        'Indice de priorité des noeuds de référence (Calcul de répartition)',
    'iidm.export.xml.extensions.referenceTerminals':
        'Terminaux référence de phase (Calcul de répartition)',
    'iidm.export.xml.extensions.secondaryVoltageControl':
        'Réglage secondaire de tension',
    'iidm.export.xml.extensions.slackTerminal': 'Nœud bilan',
    'iidm.export.xml.extensions.standbyAutomaton': 'Automate des CSPRs',
    'iidm.export.xml.extensions.startup': 'Coût de démarrage des groupes',
    'iidm.export.xml.extensions.substationPosition':
        'Coordonnées géographiques des sites',
    'iidm.export.xml.extensions.threeWindingsTransformerFortescue':
        'Données pour les calculs dissymétriques des transformateurs à trois enroulements',
    'iidm.export.xml.extensions.threeWindingsTransformerAsymmetrical':
        'Données pour les calculs dissymétriques des transformateurs à trois enroulements',
    'iidm.export.xml.extensions.threeWindingsTransformerPhaseAngleClock':
        "Angles de phase entre les enroulements (sous forme d'horloge) pour les transformateurs à trois enroulements",
    'iidm.export.xml.extensions.threeWindingsTransformerToBeEstimated':
        'Estimation des prises des régleurs et des déphaseurs des transformateurs à trois enroulements',
    'iidm.export.xml.extensions.twoWindingsTransformerFortescue':
        'Données pour les calculs dissymétriques des transformateurs à deux enroulements',
    'iidm.export.xml.extensions.twoWindingsTransformerAsymmetrical':
        'Données pour les calculs dissymétriques des transformateurs à deux enroulements',
    'iidm.export.xml.extensions.twoWindingsTransformerPhaseAngleClock':
        "Angle de phase entre les enroulements (sous forme d'horloge) pour les transformateurs à deux enroulements",
    'iidm.export.xml.extensions.twoWindingsTransformerToBeEstimated':
        'Estimation des prises des régleurs et des déphaseurs des transformateurs à deux enroulements',
    'iidm.export.xml.extensions.voltageLevelShortCircuits':
        'Données de court-circuit des postes (Version IIDM 1.0)',
    'iidm.export.xml.extensions.voltagePerReactivePowerControl':
        'Lien entre la tension de consigne et la puissance réactive en mode réglage de tension (CSPRs)',
    'iidm.export.xml.sorted': 'Trier les ouvrages dans le fichier',
    'iidm.export.xml.sorted.desc': 'Trier les ouvrages dans le fichier',
    'iidm.export.xml.version': 'Version IIDM',
    'iidm.export.xml.version.desc':
        'Version IIDM utilisée pour générer le fichier',
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

export default export_parameters_fr;
