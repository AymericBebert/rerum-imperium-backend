#!/usr/bin/env bash

tags=$(git describe --contains)

if [ -z "$tags" ]; then
  echo "No tag on current commit. Latest tags:"
  git tag | sort -V | tail -n 3

  read -rp "Enter new tag: " newtag

  [ -z "$newtag" ] && echo "No version specified" && exit 1

  if ! git tag "$newtag"; then
    read -rp "Git tag failed, continue? [y/N]: " c
    if [[ ! $c =~ ^[Yy]$ ]]; then
      echo "Cancelled"
      exit 2
    fi
    echo "Latest commit tagged with $newtag"
  fi
else
  if [[ $tags == *" "* ]]; then
    echo "Ambiguous tag. Aborting."
    exit 1
  else
    echo "Using git tag"
    newtag=$tags
  fi
fi

function delete_new_tag() {
  if [ -z "$tags" ]; then
    echo "Removing new git tag $newtag"
    git tag -d "$newtag" >/dev/null
  fi
}

version=$newtag

read -rp "Will build version $version, continue? [y/N]: " c
if [[ ! $c =~ ^[Yy]$ ]]; then
  echo "Cancelled"
  delete_new_tag
  exit 2
fi

echo "-----"
echo "Building rerum-imperium-backend:$version..."
docker build -t "aymericbernard/rerum-imperium-backend:$version" --build-arg VERSION="$version" . ||
  {
    echo 'Build failed'
    delete_new_tag
    exit 1
  }

echo "Pushing rerum-imperium-backend:$version to docker registry..."
docker push "aymericbernard/rerum-imperium-backend:$version" ||
  {
    echo 'Push failed'
    exit 1
  }

echo "Pushing git tag..."
git push origin "$newtag"
