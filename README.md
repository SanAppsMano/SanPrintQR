# SanPrintQR

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Create keys in Redis:
- `agent:agent-01` → `{"secret":"secret","lastSeen":0}`
- `printer:P01` → `{"name":"Printer 1","agentId":"agent-01","printerName":"MyPrinter","siteId":"site-1","mode":"usb"}`

Run the agent:
```
cd agent-go
cp config.example.json config.json
go run .
```

Use `/upload.html` to create a job and `/i/P01` to release it.
