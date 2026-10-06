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
`GET /api/v1/simulations/ID` until `state` is `ready` (generation takes about 4 to 9 minutes and costs roughly $0.25
to $0.85 in model fees, reported as `cost_usd`), then fetch `/bundle`. The waiting line is held in memory, so a server
restart drops jobs that had not started yet; they are reported as failed and can be submitted again.
