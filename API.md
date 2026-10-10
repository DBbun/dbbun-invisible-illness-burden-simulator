# DBbun simulator API (v1)

Use a finished simulator from another system or script, or submit documents and collect the results later,
without a browser. Everything below is also described machine-readably at `/api/v1/openapi.json`.

## 1. Start the server and create a key

```
python server.py
python make_api_key.py my-system      # prints the key once; only its hash is stored in api_keys.local.json
```

Send the key with every call except `/api/v1/health` and `/api/v1/openapi.json`:
`Authorization: Bearer <key>`. By default the API answers only on `127.0.0.1:8765`.

## 2. Call a finished simulator

```
curl -H "Authorization: Bearer $KEY" http://127.0.0.1:8765/api/v1/simulations            # list
curl -H "Authorization: Bearer $KEY" http://127.0.0.1:8765/api/v1/simulations/ID/spec     # inputs, ranges, outputs, scenarios
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
     -d '{"inputs": {"input_id": 12}, "scenario": "Default assumptions"}' \
     http://127.0.0.1:8765/api/v1/simulations/ID/run
```

`GET /api/v1/simulations/ID/fhir` returns the same model as a FHIR R4-shaped demonstration `Bundle` (`application/fhir+json`): an
`Observation` for each input and default output, a `DocumentReference` for the source paper and a `Provenance` resource. It contains no patient, is not
clinical data, uses DBbun's own identifiers, and is not certified. The file passes the official HL7 FHIR validator (R4) with no errors; see `FHIR_VALIDATION.md`.

`run` uses the same arithmetic as the browser. Inputs not supplied keep their default, values must sit inside the
input's own range, and inputs fixed by the source document cannot be changed. The reply has every output and every
forecast series. Results are illustrative simulations built from the source document, not clinical advice or
statistical forecasts.

## 3. Submit documents and come back later (asynchronous)

```
python batch_generate.py papers_folder results_folder --key $KEY               # submit all, wait, download bundles
python batch_generate.py papers_folder results_folder --key $KEY --submit-only  # submit and leave
python batch_generate.py papers_folder results_folder --key $KEY --collect      # later: download what is ready
```

Or directly: `POST /api/v1/simulations` with `{"documents": [{"name": "paper.pdf", "content_base64": "..."}]}` returns
`202` and an id at once. Jobs wait in a first-in, first-out line (up to 10 waiting) and run one at a time. Poll
`GET /api/v1/simulations/ID` until `state` is `ready` (generation takes about 4 to 9 minutes and costs $0.40
to $0.96 in model fees (25 runs; staff time, hosting and maintenance not included), reported as `cost_usd`), then fetch `/bundle`. The waiting line is held in memory, so a server
restart drops jobs that had not started yet; they are reported as failed and can be submitted again.
