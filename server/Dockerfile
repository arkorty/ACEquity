# Stage 1: Build the Go binary
FROM golang:alpine AS builder

RUN apk add --no-cache build-base git sqlite-dev

WORKDIR /server

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 go build -o ace .

# Stage 2: Run the server
FROM alpine:latest

WORKDIR /server

# Copy the server binary from the builder stage
COPY --from=builder /server/ace /server/ace

# COPY the database schema
COPY --from=builder /server/db/schema.sql /server/db/schema.sql

# Copy templates directory (required for email handlers)
COPY --from=builder /server/templates /server/templates

# Expose the port
EXPOSE 8080

# Run the server
CMD ["/server/ace"]
