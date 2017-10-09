const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const secret = process.env.SECRET || 'cf-secrets';
const token = process.env.TOKEN;

const app = express();
app.use(bodyParser.json());
app.all('/in', (req, res, next) => {
  console.log(req.headers);
  console.log(req.body);
  if (req.headers['x-github-event'] && req.headers['x-github-event'] === 'pull_request') {
    console.log(req.body.action);
    console.log(req.body.pull_request.merged);
  }
  if (req.headers['x-github-event'] && req.headers['x-github-event'] === 'push') {
    if (req.body.ref === 'refs/heads/master') {
      //pushing to master
      const newVersion = `v${1}`;
      request('https://api.github.com/repos/ajuhaszcf/webhook-test/releases', {
        auth: {
          user: 'ajuhaszcf',
          pass: token,
        },
        headers: {
          'Accept': ' application/vnd.github.v3+json',
          'User-Agent': 'CF-Webhook',
        },
        method: 'POST',
        json: true,
        body: {
          "tag_name": newVersion,
          "target_commitish": "master",
          "name": newVersion,
          "body": "Autorag of a new release",
          "draft": false,
          "prerelease": false
        },
      }, (error, response, body) => {
        if (error) {
          console.error(errot);
          return;
        }
        console.log('response', body);
      });
    }
  }
  res.status(200).end();
});
app.listen(process.env.PORT || 3000);