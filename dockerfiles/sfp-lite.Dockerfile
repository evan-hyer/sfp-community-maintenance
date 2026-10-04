FROM ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3



ARG GIT_COMMIT

LABEL org.opencontainers.image.description "sfp is a build system for modular development in Salesforce."
LABEL org.opencontainers.image.licenses "MIT"
LABEL org.opencontainers.image.url "https://github.com/flxbl-io/sfp"
LABEL org.opencontainers.image.documentation "https://docs.flxbl.io/sfp"
LABEL org.opencontainers.image.revision $GIT_COMMIT
LABEL org.opencontainers.image.vendor "Flxbl"
LABEL org.opencontainers.image.source "https://github.com/flxbl-io/sfp"
LABEL org.opencontainers.image.title "Flxbl sfp lite docker image - December 24"


ENV DEBIAN_FRONTEND=noninteractive


RUN ln -sf bash /bin/sh


RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get -y install --no-install-recommends \
      git \
      curl \
      sudo \
      jq \
      zip \
      unzip \
      make \
      g++ \
      tzdata \
      ca-certificates \
      gnupg \
    && apt-get autoremove --assume-yes \
    && apt-get clean --assume-yes \
    && rm -rf /var/lib/apt/lists/*

# Set timezone to UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install the verified runtime and the locally validated fork artifact.
COPY dockerfiles/install-node.sh /tmp/install-node.sh
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils python3 \
    && sh /tmp/install-node.sh && rm /tmp/install-node.sh \
    && rm -rf /var/lib/apt/lists/*
COPY .maintenance/flxbl-io-sfp-39.8.0.tgz /tmp/sfp.tgz
RUN npm install --global --omit=dev --no-audit --no-fund /tmp/sfp.tgz \
    && sfp --version && sfpowerscripts --version \
    && rm /tmp/sfp.tgz && npm cache clean --force

WORKDIR /root



# clear the entrypoint for azure
ENTRYPOINT []
CMD ["/bin/sh"]
