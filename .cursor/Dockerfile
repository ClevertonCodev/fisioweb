# Cursor Cloud Agent — base image (repo is cloned by Cursor; do not COPY project here).
# Aligned with .github/workflows/tests.yml (PHP 8.5, Node 22).

FROM php:8.5-cli

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        unzip \
        sqlite3 \
        libsqlite3-dev \
        libpq-dev \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
        libicu-dev \
        libzip-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-jpeg --with-freetype --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        intl \
        pcntl \
        pdo_pgsql \
        pdo_sqlite \
        pgsql \
        zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN printf 'memory_limit=1G\nupload_max_filesize=64M\npost_max_size=64M\n' \
        > /usr/local/etc/php/conf.d/zz-fisioweb.ini \
    && git config --system --add safe.directory '*'
