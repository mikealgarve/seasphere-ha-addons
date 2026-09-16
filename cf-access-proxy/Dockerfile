ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nodejs

COPY run.sh /run.sh
COPY proxy.mjs /proxy.mjs
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
