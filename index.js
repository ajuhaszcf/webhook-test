const express = require('express');
const request = require('request-promise-native');
const bodyParser = require('body-parser');
const merge = require('lodash').merge;

const secret = process.env.SECRET || 'cf-secrets';
const token = process.env.TOKEN;

const commonOptions = {
  auth: {
    user: 'ajuhaszcf',
    pass: token,
  },
  headers: {
    'Accept': ' application/vnd.github.v3+json',
    'User-Agent': 'CF-Webhook',
  },
  json: true,
};

const app = express();
app.use(bodyParser.json());
app.all('/in', (req, res, next) => {
  if (req.headers['x-github-event'] && req.headers['x-github-event'] === 'pull_request') {
    console.log(req.body.action);
    console.log(req.body.pull_request.merged);
  }
  if (req.headers['x-github-event'] && req.headers['x-github-event'] === 'push') {
    if (req.body.ref === 'refs/heads/master') {
      //pushing to master so create a new release
      console.log(req.body.commits);
      const releaseNotes = req.body.commits.map(commit => `${commit.message}`).join('\n');
      updateTag(releaseNotes);
    }
  }
  res.status(200).end();
});
app.listen(process.env.PORT || 3000);

function updateTag(releaseNotes = "Autorag of a new release") {
  return request('https://api.github.com/repos/ajuhaszcf/webhook-test/releases/latest', commonOptions)
    .then((response, body) => {
      const regex = /^(\D*)(\d*)(\D*)$/.exec(response.tag_name);
      if (!regex.length || regex.length !== 4 ) {
        throw new Error('Regex failed');
      }
      const newVersion = `${regex[1]}${parseInt(regex[2], 10) + 1}${regex[3]}`;
      console.log('tagging ', newVersion);
      return newVersion;
    })
  .then(newVersion => 
    request('https://api.github.com/repos/ajuhaszcf/webhook-test/releases', 
      merge(commonOptions, {
        method: 'POST',
        body: {
          tag_name: newVersion,
          target_commitish: "master",
          name: newVersion,
          body: releaseNotes,
          draft: false,
          prerelease: false
        },
      })
    )
  )
  .catch((error) => {
    console.error(error);
  });
}