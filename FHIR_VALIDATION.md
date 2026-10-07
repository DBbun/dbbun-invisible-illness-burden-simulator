# FHIR demonstration export: validation record

Checked 2026-10-07 with the official HL7 FHIR validator (`validator_cli.jar`, from the HL7 `org.hl7.fhir.core` releases), against FHIR R4 (4.0.1).

Command:

    java -jar validator_cli.jar samples/*.json -version 4.0.1 -tx n/a -ig defs

- `samples/`: the `fhir_demonstration.json` of each of the 25 library simulators and the one reuse demonstration (26 files).
- `defs/`: the StructureDefinitions and CodeSystems from `fhir_demo.build_definitions()` (shipped in each bundle as `fhir_definitions.json`).
- `-tx n/a`: terminology checking was switched off, so nothing was sent to an online terminology server and code systems were not checked.

Result: all 26 files: **0 errors**, 40 to 74 warnings and 11 to 19 notes per file.

The warnings are best-practice notes expected for a non-clinical demonstration: no patient (`subject`), no `performer`, no `effective[x]` time, no narrative text (`dom-6`), DBbun's own code systems have no content to check, and the Provenance activity and agent have text but no standard code.

Before the extension definitions were supplied, the same check reported 28 errors per file, all of one kind: the DBbun extensions were undefined. Defining them fixed that.

Not claimed: US Core or USCDI+ profile conformance, clinical validity, or certification.
