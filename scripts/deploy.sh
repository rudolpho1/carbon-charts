#!/usr/bin/env bash

set -e # exit with nonzero exit code if anything fails

if [ -z "$TRAVIS_TAG" ]
then
	# authenticate with the npm registry
	npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN -q

	yarn run build-all

	# Git user info configs
	git config --global user.email "carbon@us.ibm.com"
	git config --global user.name "carbon-bot"

	# Add github token to git credentials
	git config credential.helper "store --file=.git/credentials"
	echo "https://${GH_TOKEN}:@github.com" > .git/credentials 2>/dev/null

	# checkout master to get out of detached HEAD state
	git checkout master

	lerna publish --conventional-commits --yes --github-release --force-publish=* --contents dist
else
	echo "The commit is a tag, exiting the build!"

	exit 0;
fi
