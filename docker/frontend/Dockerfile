FROM php:7.4-apache

RUN a2enmod rewrite

COPY docker/frontend/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
COPY public/ /var/www/html/

EXPOSE 80
