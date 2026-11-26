# Publishing the n8n community node

The development repository is `nstdata-ai/n8n-nodes-nstdata`. The npm package is the public scoped package `@nstdata-ai/n8n-nodes-nstdata`. Confirm publish access to this exact package under the npm scope with the administrator. The original unscoped package has its own publisher binding and version history.

## Prepare and review

1. Use Node 24.22.2 and npm 11.19.1 for release builds. On a clean checkout run `npm ci --ignore-scripts`, `npm run lint`, and `npm test` (includes the TypeScript build).
2. Pack into a fresh directory outside the repository with `npm pack --ignore-scripts --json --pack-destination DIRECTORY`. Run `npm run check:package -- /absolute/path/to/the.tgz`. It installs that exact archive, loads the declared node and credential, checks the icons and example workflow, then runs mocked Crawl requests against the installed package.
3. Record the version, reviewed PR, 40-character main commit, filenames, SHA-256 and npm SHA-512 integrity. A PR build is a preview. Build the formal candidate from the reviewed, merged main commit. Use the tarball in downloads only for the documented self-hosted installation.

## Administrator setup

* Check npm Packages and Staged Packages, ownership and the intended first version. A public registry 404 does not establish name availability.
* Verify or create the GitHub environment `npm-production`, require a reviewer, disable administrator bypass and permit only the branch `main`. Consider preventing self-review.
* The scoped package is already public. For each new release, choose an unpublished version and publish the reviewed commit through GitHub Actions with provenance. The 0.1.1 version is already in the registry.
* Configure the package's GitHub trusted publisher for owner `nstdata-ai`, repository `n8n-nodes-nstdata`, workflow `release.yml`, environment `npm-production`, with direct `npm publish` allowed. Arrange the first real run inside npm's activation window. Use the company's token-free publishing policy.

## Release and verify

Open **Actions → Publish npm → Run workflow** on main. Enter the exact stable version and full reviewed commit. The checks job runs before packaging. The package job builds the node, checks the exact archive and saves the tarball and manifest together. Review the run summary and approve its environment deployment. The publish job downloads that artifact by ID, validates its manifest and hashes, and publishes the archive once using OIDC.

The readback step checks the published version, SHA-512 integrity, latest tag and presence of provenance. If publication returns an ambiguous error or readback fails, inspect the public registry before taking action. Verify the provenance link points to the reviewed repository/commit and test installation of the exact public version. Submit the verified build to the n8n Creator Portal separately.

[Company reference workflow](https://github.com/nstdata-ai/nstdata-proxy-sdk-node/blob/main/.github/workflows/release.yml) · [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) · [n8n submission requirements](https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes.md)
