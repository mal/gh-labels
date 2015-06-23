# GH Labels

Very simple script to read labels from one repo, and mirror them (adding,
removing and updating) to all other repos in an organisation.

## Usage

```sh
export GITHUB_TOKEN=<your-github-api-token>
export GITHUB_ORG=<organisation-name>       # => org
export GITHUB_LABEL_MASTER=<master-repo>    # => org/repo

npm install
node index.js
```
