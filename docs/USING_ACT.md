# Using `act` for Local GitHub Actions Development

This guide will help new developers use [`act`](https://github.com/nektos/act) to run and test GitHub Actions workflows locally in this repository.

---

## 1. Running a Specific Workflow

To run only the workflow defined in `.github/workflows/ci-cd.yaml`, use:

```sh
act -W .github/workflows/ci-cd.yaml push
```
- Replace `push` with `pull_request` to simulate a pull request event.
- The `-W` flag specifies the workflow file to use.

To run a specific job within the workflow:
```sh
act -W .github/workflows/ci-cd.yaml push -j <job-name>
```
Replace `<job-name>` with the job you want to run (e.g., `test-fastci-action`).

---

## 2. Passing Inputs and Secrets

If your workflow requires secrets (like `fastci_otel_token` or `GITHUB_TOKEN`), pass them using the `-s` flag:

```sh
act -W .github/workflows/ci-cd.yaml push \
  -s FASTCI_OTEL_TOKEN=your_token_here \
  -s GITHUB_TOKEN=your_github_token_here
```
- Use as many `-s` flags as needed for different secrets.

---

## 3. Where Does `act` Store Cache?

By default, `act` stores cache data in:

```
~/.cache/act
```

You can change this location by setting the `ACT_CACHE_DIR` environment variable:

```sh
export ACT_CACHE_DIR=/your/custom/cache/dir
act ...
```

---

## 4. Is the Cache on My Machine or in Docker?

The cache is stored **on your local machine** (e.g., `~/.cache/act`).

- `act` mounts this directory into the Docker container so that cache persists between runs.
- You can inspect or clear the cache directly from your host by deleting files in `~/.cache/act`.

---

## 5. Additional Tips

- Make sure Docker is running before using `act`.
- If you need to simulate different matrix values (like OS or architecture), use the `-P` flag or edit the workflow matrix.
- For more advanced usage, see the [act documentation](https://github.com/nektos/act#usage).

---

If you have more questions, ask in the team chat or check the official act documentation!
