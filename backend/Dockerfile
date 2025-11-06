# Simalar from Frontend Module
FROM node:20


# Standard Express Js building block
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

ENV NODE_OPTIONS="--max-old-space-size=1024"

#Default the backend to 3000

# ✅ Prisma generate لضمان عمل ORM على Render
RUN npx prisma generate

# ✅ Expose port ليتعرف عليه Render
EXPOSE 3000

# Start the node.js server https://docs.licensegate.io/self-hosting/#backend
CMD npm run start