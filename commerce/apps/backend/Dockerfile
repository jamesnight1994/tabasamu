# Medusa backend — development image
FROM node:20-bookworm-slim

RUN corepack enable && corepack prepare yarn@4.10.3 --activate

WORKDIR /workspace

# Install workspace deps from commerce root
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/backend/package.json ./apps/backend/package.json

RUN yarn install

COPY apps/backend ./apps/backend

WORKDIR /workspace/apps/backend

EXPOSE 9000

CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa develop --host 0.0.0.0"]
