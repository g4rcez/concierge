FROM node:16.13.1-alpine

COPY . /app
RUN ls /app

ARG VERSION
ENV LOCAL_PATH="/app/concierge_assets"

WORKDIR /app/asdf
RUN yarn install --ignore-optional
RUN sh deploy.sh

WORKDIR /app/asdf
RUN yarn install --ignore-optional
RUN sh deploy.sh

WORKDIR /app/concierge
RUN yarn install --ignore-optional
RUN sh deploy.sh

ENTRYPOINT ["yarn", "serve"]