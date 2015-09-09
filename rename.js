if (!process.env.GITHUB_TOKEN) {
    console.log('Need GH token (GITHUB_TOKEN)');
    process.exit(1);
}

if (!process.env.GITHUB_ORG) {
    console.log('Need GH organisation (GITHUB_ORG)');
    process.exit(1);
}

var github = require('octonode').client(process.env.GITHUB_TOKEN);
var Promise = require('es6-promise').Promise;

var org = process.env.GITHUB_ORG;
var seed = process.env.GITHUB_LABEL_MASTER;

var repos = new Promise(function (done) {
    github.org(org).repos({ per_page: 100 }, function (err, repos) {
        if (err) throw err;
        done(repos);
    });
});

var labels = Promise.resolve(
    process
        .argv
        .slice(2)
        .reduce(function (a, b) {
            var kv = b.split('=');
            a[kv[0]] = kv[1];
            return a;
        }, {})
);

function log(action, repo, label, delta) {
    return function (err, res) {
        var message = [];

        if (!err) {
            if (res.url) label = res;
            action += 'd';
        } else message.push('FAILED to');

        message.push(action);
        message.push(repo.name + '/' + label.name);

        message = message.join(' ');
        if (delta)
            message += ': ' + delta.join(' -> ');

        console.log(message);
        if (err) console.log(err.body);
    };
}

function splat(fn) {
    return function (args) {
        return fn.apply(null, args);
    };
}

function update(repo, labels) {
    Object.keys(labels).forEach(function (label) {
        var actual = label;
        var expect = labels[label];

        return github.label(repo.name, actual)
            .update({ name: expect }, log(
                'update', repo, label, [actual, expect]
            ));
    });
}

Promise.all([repos, labels])
    .then(splat(function (repos, labels) {
        repos.forEach(function (repo) {
            repo = github.repo(repo.full_name);
            update(repo, labels);
        });
    }));
