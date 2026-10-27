# Imagem do bin/fisio-app para desenvolvimento local.
#
# Construída na máquina (nativa no Mac com chip Apple) e reaproveitada por
# todas as pastas. Não tem Node: o front compila no host, com o node_modules
# da própria pasta.
FROM php:8.5-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpq-dev \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
        libicu-dev \
        libzip-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-jpeg --with-freetype --with-webp \
    && docker-php-ext-install -j"$(nproc)" gd bcmath exif intl pcntl pdo_pgsql pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN printf 'memory_limit=1G\nupload_max_filesize=64M\npost_max_size=64M\n' > /usr/local/etc/php/conf.d/zz-dev.ini \
    && git config --system --add safe.directory /var/www/html
