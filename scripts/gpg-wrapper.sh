#!/usr/bin/env bash
exec gpg --pinentry-mode loopback --passphrase 12345678 "$@"

