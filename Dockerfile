# STAGE 1 Build
FROM node:20-alpine AS builder
WORKDIR /shgapp
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# STAGE 2 Run
FROM node:20-alpine
WORKDIR /shgapp

RUN addgroup -S shgapp && adduser -S -G shgapp shgapp

COPY --from=builder /shgapp/public ./public
COPY --from=builder /shgapp/.next/standalone ./
COPY --from=builder /shgapp/.next/static ./.next/static

RUN chown -R shgapp:shgapp /shgapp
USER shgapp

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]
