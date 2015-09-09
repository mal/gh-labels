# GH Labels

Very simple script to read labels from one repo, and mirror them (adding,
removing and updating) to all other repos in an organisation.

## Usage (sync)

```sh
export GITHUB_TOKEN=<your-github-api-token>
export GITHUB_ORG=<organisation-name>       # => org
export GITHUB_LABEL_MASTER=<master-repo>    # => org/repo

npm install
node sync.js
```

## Usage (rename)

```sh
export GITHUB_TOKEN=<your-github-api-token>
export GITHUB_ORG=<organisation-name>       # => org

npm install
node rename.js oldlabel=newlabel ...
```
