FROM gridsuite/httpd

# chown to www-data to allow the subsequent sed to work.
# Note that the rest of the files from the image are already www-data:www-data
COPY --chown=www-data:www-data app-httpd.conf /usr/local/apache2/conf/app-httpd.conf
COPY --chown=www-data:www-data build /usr/local/apache2/htdocs/gridexplore

# setup ssi for base in index.html using the per request variable defined in app-httpd.conf
RUN sed -i -e 's;<base href="/" />;<base href="<!--#echo var="BASE" -->" />;' /usr/local/apache2/htdocs/gridexplore/index.html
