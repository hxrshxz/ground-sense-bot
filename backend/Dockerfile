
# Simple go project

FROM golang:1.16-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN go build -o /ground-sense-bot

EXPOSE 8080

CMD [ "/ground-sense-bot" ]
