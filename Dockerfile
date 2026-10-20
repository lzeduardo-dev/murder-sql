FROM node:22-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependências primeiro (aproveita cache do Docker)
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que a API usa
EXPOSE 3000

# Comando para rodar a aplicação (ajuste conforme seu package.json)
# Se usar ts-node ou tsx: CMD ["npm", "run", "dev"]
# Se usar build: CMD ["npm", "start"]
CMD ["npm", "run", "dev"]