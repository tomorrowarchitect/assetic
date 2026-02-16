FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Use non-interactive frontend for apt operations
ARG DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Install common runtime packages in a single layer to reduce image size
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      wget gnupg curl ca-certificates x11vnc xvfb fluxbox xfonts-base \
      bubblewrap socat novnc python3-websockify jq libcap2-bin \
      git-secret gpg gpg-agent \
      libx11-6 libxcomposite1 libxdamage1 libxrandr2 libnss3 \
      libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libxkbcommon0 \
      libasound2t64 libcups2t64 libdbus-1-3 libexpat1 libgbm1 \
      libpango-1.0-0 libpangocairo-1.0-0 libx11-xcb1 libxcb1 libxcursor1 \
      libxext6 libxfixes3 libxi6 libxrender1 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Make bubblewrap setuid (devcontainer): allows bwrap to create namespaces when host disables unprivileged userns.
RUN bwrap_path="$(command -v bwrap || true)"; \
    if [ -n "$bwrap_path" ]; then \
      echo "Making bubblewrap setuid root (devcontainer)"; \
      chown root:root "$bwrap_path" && chmod 4755 "$bwrap_path"; \
    fi

# Download and extract latest precompiled Chromium for aarch64 (best-effort)
RUN set -eux; \
    mkdir -p /opt/chromium /tmp; \
    cd /tmp; \
    DOWNLOAD_URL=$(curl -s https://api.github.com/repos/ungoogled-software/ungoogled-chromium-portablelinux/releases/latest | \
      jq -r '.assets[] | select(.name | contains("arm64_linux.tar.xz")) | .browser_download_url' | head -1); \
    if [ -n "$DOWNLOAD_URL" ]; then \
      wget -q "$DOWNLOAD_URL" -O chromium.tar.xz; \
      tar -xJf chromium.tar.xz -C /opt/chromium --strip-components=1; \
      rm -f chromium.tar.xz; \
      ln -sf /opt/chromium/chrome /usr/local/bin/chromium-browser; \
    else \
      echo "warning: no chromium download URL found"; \
    fi

# Install Node.js LTS and sandbox runtime (provides vendor/seccomp)
RUN set -eux; \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -; \
    apt-get update; \
    apt-get install -y --no-install-recommends nodejs; \
    npm install -g @anthropic-ai/sandbox-runtime; \
    npm cache clean --force || true; \
    rm -rf /var/lib/apt/lists/*

# Copy seccomp BPF files from the installed sandbox-runtime into a stable location
RUN set -eux; \
    mkdir -p /usr/local/share/sandbox-runtime/seccomp; \
    npm_root="$(npm root -g)"; \
    src="$npm_root/@anthropic-ai/sandbox-runtime/vendor/seccomp"; \
    if [ -d "$src" ]; then \
      cp -a "$src/." /usr/local/share/sandbox-runtime/seccomp/; \
      chmod -R a+rX /usr/local/share/sandbox-runtime/seccomp; \
    else \
      echo "warning: sandbox-runtime seccomp directory not found at $src"; \
    fi

# Install 1Password CLI (repository + package)
RUN set -eux; \
    curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg; \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" | tee /etc/apt/sources.list.d/1password.list; \
    mkdir -p /etc/debsig/policies/AC2D62742012EA22/; \
    curl -sS https://downloads.1password.com/linux/debian/debsig/1password.pol | tee /etc/debsig/policies/AC2D62742012EA22/1password.pol; \
    mkdir -p /usr/share/debsig/keyrings/AC2D62742012EA22; \
    curl -sS https://downloads.1password.com/linux/debian/debsig/1password.pol || true; \
    curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg || true; \
    apt-get update; \
    apt-get install -y --no-install-recommends 1password-cli; \
    rm -rf /var/lib/apt/lists/*

# Add 1Password CLI bash completion (best-effort)
RUN echo 'source <(op completion bash)' >> /home/vscode/.bashrc || true

# Install Linux Homebrew and Claude Code via brew as 'vscode' user
RUN mkdir -p /home/linuxbrew/.linuxbrew && chown -R vscode:vscode /home/linuxbrew
ENV NONINTERACTIVE=1
USER vscode
RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
    && /home/linuxbrew/.linuxbrew/bin/brew --version
RUN echo >> /home/vscode/.bashrc \
    && echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"' >> /home/vscode/.bashrc \
    && eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)" \
    && /home/linuxbrew/.linuxbrew/bin/brew install --cask claude-code
USER root

# Copy post-start helper and devcontainer helper scripts
COPY postStartCommand.sh /usr/local/bin/postStartCommand.sh
RUN chmod +x /usr/local/bin/postStartCommand.sh

COPY bin/ /tmp/devcontainer-bin/
RUN set -eux; \
    mkdir -p /usr/local/bin; \
    for f in /tmp/devcontainer-bin/*; do \
      [ -e "$f" ] || continue; \
      name=$(basename "$f"); \
      echo "Installing /usr/local/bin/$name"; \
      install -m 0755 "$f" "/usr/local/bin/$name"; \
    done; \
    rm -rf /tmp/devcontainer-bin/