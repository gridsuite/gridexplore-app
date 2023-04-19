FROM bitnami/apache:2.4.55@sha256:bbe50190eb3bbf3be6f61318004480b3230846bfd52dec9286bd1862254c1719

USER root
COPY app-httpd.conf /opt/bitnami/apache/conf/bitnami/bitnami.conf
COPY build /opt/bitnami/apache/htdocs/gridexplore
RUN sed -i -e 's;<base href="\./"/>;<base href="<!--#echo var="BASE" -->"/>;' /opt/bitnami/apache/htdocs/gridexplore/index.html
USER 1001
