FROM php:7.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY docker/backend/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
COPY api/ /var/www/html/api/
COPY conexao.php /var/www/html/
COPY config.php /var/www/html/

EXPOSE 80
