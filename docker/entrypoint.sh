#!/bin/sh
# Point d'entrée du conteneur : le volume /data (.env, workflow.config.json, résultats) doit appartenir
# à l'utilisateur node. Sur un hôte Linux, le dossier data/ est souvent créé par root : on rétablit alors
# le propriétaire, puis on abandonne les droits root avant de lancer la commande.
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /data
  # propriétaire rétabli seulement si nécessaire (dossier ou fichiers n'appartenant pas à node)
  if [ "$(stat -c %U /data)" != "node" ] || find /data -mindepth 1 ! -user node -print -quit | grep -q .; then
    echo "🔧 Droits du volume /data attribués à l'utilisateur node (uid $(id -u node))"
    chown -R node:node /data
  fi
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
