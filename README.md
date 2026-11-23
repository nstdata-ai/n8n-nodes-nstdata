# Nstdata Crawl for n8n

[简体中文](README.zh-CN.md)

Turn a URL from a spreadsheet, webhook or previous n8n step into Markdown, HTML or a list of links. **Nstdata Crawl** submits one page per incoming item. You can wait for the content in the same step or retrieve it later using its task ID.

## Download 0.1.1

[Download the repository ZIP](https://github.com/nstdata-ai/n8n-nodes-nstdata/archive/refs/heads/main.zip), extract it, and open a terminal in the folder containing this README. The ZIP contains the source, an installation script and the ready-to-install [0.1.1 package](https://github.com/nstdata-ai/n8n-nodes-nstdata/raw/refs/heads/main/downloads/n8n-nodes-nstdata-0.1.1.tgz). No build is needed. The commands below use a POSIX shell on macOS, Linux or WSL.

This guide covers **self-hosted n8n** with community nodes enabled. The node has been tested with n8n **2.47.4**. Installing a local file requires access to the n8n host or container.

## Install in Docker or Docker Compose

1. Run `docker ps` and find the name of your n8n application container. The example uses `n8n-local`. Its n8n data directory is `/home/node/.n8n`. A persistent volume or bind mount at that path keeps the node installed when the container is recreated.
2. Run these commands from the extracted repository. Replace the container name with yours. Restart when current workflow executions have finished.

```sh
container=n8n-local
archive=n8n-nodes-nstdata-0.1.1.tgz
docker cp "downloads/$archive" "$container:/tmp/$archive"
docker exec -i -u node "$container" sh -s -- "/tmp/$archive" /home/node/.n8n < scripts/install-local.sh
docker restart "$container"
```

3. Reopen the n8n editor, click **Add node**, and search for **Nstdata Crawl**. If you run separate n8n workers, install the same version on every process that executes workflows and restart those processes.

## Install in a local Node.js instance

Stop n8n after active runs finish. As the same OS user that runs n8n, execute the following from the extracted repository. Replace `$HOME/.n8n` if you use a different data directory. It should already exist. The installer uses `node`, `tar` and `sh` from your environment.

```sh
sh scripts/install-local.sh downloads/n8n-nodes-nstdata-0.1.1.tgz "$HOME/.n8n"
```

Start n8n with your usual command or service manager, refresh the editor, and search for **Nstdata Crawl**. Both installation methods put the compiled package in `nodes/node_modules/n8n-nodes-nstdata` inside the selected data directory.

## Connect your Nstdata account

1. Obtain an API key with Crawl access from the [Nstdata dashboard](https://app.nstdata.io/).
2. Add **Nstdata Crawl** to the canvas. Use **Nstdata API Key** as the credential type, select **Create new credential**, enter your key and click **Save**.
3. Look for **Connection tested successfully**. The test reads Nstdata account information. A scrape uses the Crawl access and credits of the account that owns the key.

You can reuse this credential in other workflows. If your existing n8n **Simplified Custom Auth** credential already sets the Nstdata `X-API-Key` header, select **Reuse HTTP Request Credential** to use it.

## Run your first page

Connect **Manual Trigger → Nstdata Crawl**. Choose **Scrape a Page**, enter `https://example.org/`, select **Markdown**, keep **Wait for Content**, and execute the workflow. A completed item contains `status: "completed"`, a `taskId`, and the page text in `markdown`. In the next node, use `{{ $json.markdown }}`.

| Operation | What to supply | What you get |
| --- | --- | --- |
| Scrape a Page | One HTTP(S) URL per item, such as `{{ $json.url }}` | Selected formats, or a task ID immediately |
| Get Scrape Result | A previous `taskId` | Current task status and, when complete, its result |
| Read Referenced Content | A `markdownRef` or `htmlRef` and its content type | Text in `markdown` or `html` |

If the wait expires, the node returns the existing task ID and `timedOut: true`. Query that ID with **Get Scrape Result**. Executing **Scrape a Page** again submits a new task and may use more credits. Check for a completed status before consuming text. If the API reports truncation, the item includes `truncated: true`.

To try multiple URLs, use **Import from File** in n8n and select the [example workflow](examples/multiple-urls-to-markdown.json). Select your credential in **Scrape each URL** before running it. Each output item stays linked to its source row.

## Update or roll back

Download the repository for the version you want, use the matching archive in `downloads/`, and repeat the installation commands with the new filename. The installer checks the package before replacing it and prints the backup path for the previous installation. It changes the node package only. Saved workflows and credentials stay in the n8n data directory. Keep a copy of the archive you last tested.

After restarting, open the node, verify the saved credential, and run one test page. To roll back, repeat the installation with the previous archive and restart n8n. If the node is missing, check the actual data directory, look for the package under `nodes/node_modules/`, and inspect n8n startup logs. If the credential test fails, check your key and connectivity to `api.nstdata.io`.

## Build from source

With Node.js and npm available, run the commands below in the repository root. `npm pack` creates a local tarball that you can install with the same script. Development uses the n8n node CLI, TypeScript and simulated API responses for tests.

```sh
npm ci
npm run lint
npm test
npm pack
```

[Crawl API documentation](https://docs.nstdata.io/docs/crawl) · [n8n self-hosted node documentation](https://docs.n8n.io/integrations/creating-nodes/deploy/install-private-nodes/) · [MIT license](LICENSE)
