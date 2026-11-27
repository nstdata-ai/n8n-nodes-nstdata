<p align="center">
  <img src="https://raw.githubusercontent.com/nstdata-ai/nstdata-mcp-server/45fd0e479df7509165e3e8d6adbc32503c5d1010/docs/assets/mcp-banner.png" alt="Nstdata — Power AI Agent with Internet Data" width="960">
</p>

<h1 align="center">Nstdata Crawl for n8n</h1>

<p align="center">
Turn URLs from a spreadsheet or webhook into Markdown, HTML, or links for the next step in your n8n workflow.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nstdata-ai/n8n-nodes-nstdata"><img src="https://img.shields.io/npm/v/%40nstdata-ai%2Fn8n-nodes-nstdata?logo=npm" alt="npm package version"></a>
  <a href="https://github.com/nstdata-ai/n8n-nodes-nstdata/actions/workflows/check.yml"><img src="https://img.shields.io/github/actions/workflow/status/nstdata-ai/n8n-nodes-nstdata/check.yml?branch=main&amp;label=checks" alt="Repository checks on main"></a>
  <a href="https://github.com/nstdata-ai/n8n-nodes-nstdata/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://app.nstdata.io/"><img src="https://img.shields.io/badge/Dashboard-4F46E5?style=for-the-badge&amp;logo=googlechrome&amp;logoColor=white" alt="Nstdata dashboard"></a>
  <a href="https://docs.nstdata.io/docs/crawl/"><img src="https://img.shields.io/badge/Crawl_API_Docs-2563EB?style=for-the-badge&amp;logo=readthedocs&amp;logoColor=white" alt="Crawl API documentation"></a>
  <a href="https://discord.gg/sMsfTzCpe7"><img src="https://img.shields.io/badge/Join_our_Discord-5865F2?style=for-the-badge&amp;logo=discord&amp;logoColor=white" alt="Join our Discord"></a>
  <a href="https://x.com/nstdata"><img src="https://img.shields.io/badge/Follow_on_X-000000?style=for-the-badge&amp;logo=x&amp;logoColor=white" alt="Follow Nstdata on X"></a>
</p>

[English](https://github.com/nstdata-ai/n8n-nodes-nstdata#readme) · [Simplified Chinese](https://github.com/nstdata-ai/n8n-nodes-nstdata/blob/main/GUIDE.zh-CN.md)

---

## Choose your n8n setup

- **Self-hosted n8n.** An owner or admin can open **Settings → Community nodes → Install**, enter `@nstdata-ai/n8n-nodes-nstdata`, and confirm installation. Your instance must allow unverified community nodes. After installation, add **Nstdata Crawl** to your workflow and select a Crawl API key. [n8n installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/gui-installation/)
- **n8n Cloud.** The node is published on npm and is under review for the n8n verified directory. In the meantime, use the built-in **HTTP Request** node to call the Crawl API with your Nstdata API key.

Once installed, the node submits one page per input item. Wait for the content in the same step or pass the task ID downstream. The [daily coffee digest](#example-workflow--daily-coffee-digest) shows how to turn product pages into a scheduled email.

## Package name

Install `@nstdata-ai/n8n-nodes-nstdata`. If you used the earlier unscoped package, export your workflows and keep a backup. In a test copy of each workflow JSON, change the Nstdata node's `type` from `n8n-nodes-nstdata.nstdataCrawl` to `@nstdata-ai/n8n-nodes-nstdata.nstdataCrawl`. Install the scoped package on a test instance, import the copy and select the Crawl credential. Verify the workflow before switching production. Use one package at a time, since both register the same credential type.

## Download 0.1.2

[Download the repository ZIP](https://github.com/nstdata-ai/n8n-nodes-nstdata/archive/refs/heads/main.zip), extract it, and open a terminal in the folder containing this README. The ZIP contains the source, an installation script and the ready-to-install [0.1.2 package](https://github.com/nstdata-ai/n8n-nodes-nstdata/raw/refs/heads/main/downloads/nstdata-ai-n8n-nodes-nstdata-0.1.2.tgz). No build is needed. The commands below use a POSIX shell on macOS, Linux or WSL.

The installation steps below cover **self-hosted n8n** with community nodes enabled. The node has been tested with n8n **2.47.4**. Installing a local file requires access to the n8n host or container.

## Install in Docker or Docker Compose

1. Run `docker ps` and find the name of your n8n application container. The example uses `n8n-local`. Its n8n data directory is `/home/node/.n8n`. A persistent volume or bind mount at that path keeps the node installed when the container is recreated.
2. Run these commands from the extracted repository. Replace the container name with yours. Restart when current workflow executions have finished.

```sh
container=n8n-local
archive=nstdata-ai-n8n-nodes-nstdata-0.1.2.tgz
docker cp "downloads/$archive" "$container:/tmp/$archive"
docker exec -i -u node "$container" sh -s -- "/tmp/$archive" /home/node/.n8n < scripts/install-local.sh
docker restart "$container"
```

3. Reopen the n8n editor, click **Add node**, and search for **Nstdata Crawl**. If you run separate n8n workers, install the same version on every process that executes workflows and restart those processes.

## Install in a local Node.js instance

Stop n8n after active runs finish. As the same OS user that runs n8n, execute the following from the extracted repository. Replace `$HOME/.n8n` if you use a different data directory. It should already exist. The installer uses `node`, `tar` and `sh` from your environment.

```sh
sh scripts/install-local.sh downloads/nstdata-ai-n8n-nodes-nstdata-0.1.2.tgz "$HOME/.n8n"
```

Start n8n with your usual command or service manager, refresh the editor, and search for **Nstdata Crawl**. Both installation methods put the compiled package in `nodes/node_modules/@nstdata-ai/n8n-nodes-nstdata` inside the selected data directory.

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

## Example workflow · Daily coffee digest

The workflow selects up to three available 12 oz coffees from Counter Culture Coffee, reads their product pages with Nstdata Crawl, and emails a digest with product images, prices, and an HTML attachment. The template uses Chinese node labels.

1. Save the [coffee digest workflow JSON](https://github.com/nstdata-ai/n8n-nodes-nstdata/blob/main/docs/workflows/coffee-shelf.n8n.json) to your computer. On GitHub, open the file and click **Download raw file**.
2. In a self-hosted n8n instance with **Nstdata Crawl** installed, create a blank workflow. Open **…** in the editor’s upper-right corner, choose **Import from File**, and select the JSON.
3. Open the two Nstdata nodes, the first set to **Scrape a Page** and the second to **Get Scrape Result**. Select the same **Nstdata API Key** credential in both.
4. Open the final **Send Email** node, choose your SMTP credential, and replace both example addresses with an authorized sender and your own recipient address. To preview without sending email, execute the **Code** node immediately before **Convert to File** and inspect **Output → JSON** for `html` and `emailHtml`.
5. Select the **Manual Trigger** and click **Execute workflow** to test delivery. Open **coffee-shelf.html** in the received email. To enable the daily schedule afterwards, save and publish the workflow with its **09:00 Schedule Trigger** (Asia/Shanghai).

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
