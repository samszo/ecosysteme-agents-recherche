# Écosystème d'agents IA pour la production d'articles scientifiques
# Image : code dans /app, données (.env, workflow.config.json, résultats) dans le volume /data
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    RUNNING_IN_DOCKER=1 \
    HOST=0.0.0.0 \
    PORT=7272 \
    TZ=Europe/Paris

WORKDIR /app

# dépendances (tsx, devDependency, exécute le TypeScript : on installe tout)
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund && npm cache clean --force

# code et documentation
COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs
COPY grille_annotation.md README.md ./

# point d'entrée : droits du volume /data, puis exécution en tant qu'utilisateur node
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# commandes : interface web (par défaut) et workflow en ligne de commande
# (lancées en root, par exemple avec docker compose exec, elles passent aussi par le point d'entrée)
RUN printf '#!/bin/sh\nexec /usr/local/bin/docker-entrypoint.sh /app/node_modules/.bin/tsx /app/src/ui/server.ts "$@"\n' > /usr/local/bin/workflow-ui \
 && printf '#!/bin/sh\nexec /usr/local/bin/docker-entrypoint.sh /app/node_modules/.bin/tsx /app/src/index.ts "$@"\n' > /usr/local/bin/workflow \
 && chmod +x /usr/local/bin/workflow-ui /usr/local/bin/workflow /usr/local/bin/docker-entrypoint.sh \
 && mkdir -p /data && chown node:node /data

# répertoire de données : .env, workflow.config.json, AttenduAPP.md, PropAPP.md, rapport, graphe…
WORKDIR /data
VOLUME ["/data"]
# le conteneur démarre en root le temps d'ajuster les droits de /data (docker/entrypoint.sh), puis passe en node

EXPOSE 7272
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 7272) + '/api/run').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/app/node_modules/.bin/tsx", "/app/src/ui/server.ts"]
