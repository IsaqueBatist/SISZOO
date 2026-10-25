FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# KPIs e graficos do dashboard usam o backend real (T38). Sem estas flags o
# front cai no mock (dashboardApi/graficosApi tratam ausente como "usar mock"),
# e a imagem de producao mostrava dados de exemplo.
ARG VITE_USE_MOCK_KPIS=false
ARG VITE_USE_MOCK_GRAFICOS=false
ENV VITE_USE_MOCK_KPIS=$VITE_USE_MOCK_KPIS
ENV VITE_USE_MOCK_GRAFICOS=$VITE_USE_MOCK_GRAFICOS
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
