if (!process.env.GITHUB_TOKEN) {
    console.log('Need GH token (GITHUB_TOKEN)');
    process.exit(1);
}

if (!process.env.GITHUB_ORG) {
    console.log('Need GH organisation (GITHUB_ORG)');
    process.exit(1);
}

if (!process.env.GITHUB_LABEL_MASTER) {
    console.log('Need GH label master repo (GITHUB_LABEL_MASTER)');
    process.exit(1);
}

var ignore = []
if (process.env.GITHUB_LABEL_IGNORE) {
    ignore = process.env.GITHUB_LABEL_IGNORE.split(',')
}

var github = require('octonode').client(process.env.GITHUB_TOKEN);
var Promise = require('es6-promise').Promise;

var org = process.env.GITHUB_ORG;
var seed = process.env.GITHUB_LABEL_MASTER;

ignore.push(seed)

var repos = Promise.all([
    new Promise(function (done) {
        github.org(org).repos({ page: 1, per_page: 100 }, function (err, repos) {
            if (err) throw err;
            done(repos);
        });
    }),
    new Promise(function (done) {
        github.org(org).repos({ page: 2, per_page: 100 }, function (err, repos) {
            if (err) throw err;
            done(repos);
        });
    })
]).then(function (pages) {
  return pages.shift().concat(...pages);
});

var labels = new Promise(function (done) {
    github.repo(seed).labels({per_page: 250}, function (err, labels) {
        done(labels.reduce(function (out, label) {
            out[label.name] = label.color;
            return out;
        }, {}));
    });
});

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

function update(repo, template, current) {
    var exists = [];

    current.forEach(function (label) {
        var actual = label.color;
        var label = github.label(repo.name, label.name);
        var expect = template[label.name];

        exists.push(label.name);

        switch (expect) {
            case actual: // matches, no op
                return;
            case undefined: // extra, must delete
                label.name = encodeURI(label.name)
                return label.delete(log('delete', repo, label));
            default: // mismatch, needs update
                return label.update({ color: expect }, log(
                    'update', repo, label, [actual, expect]
                ));
        }
    });

    Object.getOwnPropertyNames(template).forEach(function (label) {
        if (~exists.indexOf(label)) return;
        repo.label({
            name: label,
            color: template[label]
        }, log('create', repo, {name: label}));
    });
}

Promise.all([repos, labels])
    .then(splat(function (repos, template) {
        repos.filter(r => !r.archived).forEach(function (repo) {
            if (~ignore.indexOf(repo.full_name)) return;

            repo = github.repo(repo.full_name);

            repo.labels({per_page: 250}, function (err, labels) {
                update(repo, template, labels);
            });
        });
    }));
